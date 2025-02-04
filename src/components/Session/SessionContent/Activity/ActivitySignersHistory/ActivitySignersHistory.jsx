/* eslint-disable camelcase */
import React from 'react';
import PropTypes from 'prop-types';
import { List, AutoSizer, InfiniteLoader } from 'react-virtualized';
import createStellarIdenticon from 'stellar-identicon-js';
import images from '../../../../../images';
import { formatDate, ROW_HEIGHT, SCROLL_WIDTH, TABLE_MAX_HEIGHT } from '../Activity';
import Driver from '../../../../../lib/Driver';
import ActivityFromEffectsBase from '../ActivityFromEffectsBase';

const SIGNERS_TYPES = ['signer_removed', 'signer_created', 'signer_updated', 'account_thresholds_updated'];

export default class ActivitySignersHistory extends ActivityFromEffectsBase {
    static async goToStellarExpert(operation, isTestnet) {
        const { transaction_hash } = await operation();
        window.open(`https://stellar.expert/explorer/${isTestnet ? 'testnet' : 'public'}/tx/${transaction_hash}`, '_blank');
    }

    static filterEffects(history) {
        return history.filter(item => (SIGNERS_TYPES.includes(item.type)));
    }

    static getViewType(type, weight, low_threshold, med_threshold, high_threshold) {
        switch (type) {
            case 'account_thresholds_updated': return ({
                viewType: 'Thresholds updated',
                keyWeight: (<span>Low: {low_threshold} Med: {med_threshold} High: {high_threshold}</span>),
            });
            case 'signer_removed': return ({
                viewType: (<span className="red">Signer removed</span>),
                keyWeight: weight,
            });
            case 'signer_created': return ({
                viewType: (<span className="green">Signer created</span>),
                keyWeight: weight,
            });
            case 'signer_updated': return ({
                viewType: 'Signer updated',
                keyWeight: weight,
            });
            default: break;
        }
        return null;
    }

    getSignerHistoryRow(historyItem, key, style, isTestnet) {
        const { created_at, type, operation,
            low_threshold, med_threshold, high_threshold, public_key, weight } = historyItem;
        const { time, date } = formatDate(created_at);
        const canvas = public_key && createStellarIdenticon(public_key);
        const renderedIcon = public_key && canvas.toDataURL();
        const { viewType, keyWeight } =
            this.constructor.getViewType(type, weight, low_threshold, med_threshold, high_threshold);

        const viewKey = public_key ?
            (<div>
                <div className="Activity-table-identicon">
                    <img src={renderedIcon} alt="id" />
                </div>
                <span>{public_key.substr(0, 18)}...{public_key.substr(-12, 12)}</span>
            </div>) :
            (<span>—</span>);


        return (
            <div key={key} style={style} className="Activity-table-row">
                <div className="Activity-table-cell">{date} {time}</div>
                <div className="Activity-table-cell ">{viewType}</div>
                <div className="Activity-table-cell">{keyWeight}</div>
                <div className="Activity-table-cell flex8">{viewKey}</div>
                <div className="Activity-table-cell Activity-table_actions flex1">
                    <img
                        title="StellarExpert"
                        src={images['icon-info']}
                        alt="i"
                        onClick={() => { this.constructor.goToStellarExpert(operation, isTestnet).then(); }}
                    />
                </div>
            </div>
        );
    }

    render() {
        const { d } = this.props;
        const { effectsHistory, loading } = d.effects;
        const signersHistory = this.constructor.filterEffects(effectsHistory);

        const listHeight = ROW_HEIGHT * signersHistory.length;
        const maxHeight = Math.min(listHeight, TABLE_MAX_HEIGHT);
        const withScroll = listHeight > TABLE_MAX_HEIGHT;

        return (
            <div className="Activity_wrap">
                <div className="Activity_header">
                    <span>
                        Signers history
                        {loading &&
                            <span className="nk-spinner-small-black">
                                <div className="nk-spinner" />
                            </span>}
                    </span>
                </div>
                <div className="Activity-table">
                    <div className="Activity-table-row head" style={{ marginRight: withScroll ? SCROLL_WIDTH : 0 }}>
                        <div className="Activity-table-cell">Date/Time</div>
                        <div className="Activity-table-cell">Type</div>
                        <div className="Activity-table-cell">Key weight</div>
                        <div className="Activity-table-cell flex8">Key</div>
                        <div className="Activity-table-cell Activity-table_actions flex1" />
                    </div>
                    <div className="Activity-table-body" style={{ height: maxHeight }}>
                        <AutoSizer>
                            {({ height, width }) => (
                                <InfiniteLoader
                                    isRowLoaded={() => {}}
                                    rowCount={signersHistory.length}
                                    loadMoreRows={e => {
                                        if (e.stopIndex + 40 > signersHistory.length) {
                                            this.props.d.effects.loadMoreHistory();
                                        }
                                    }}
                                >
                                    {({ onRowsRendered, registerChild }) => (
                                        <List
                                            width={width}
                                            height={height}
                                            onRowsRendered={onRowsRendered}
                                            ref={registerChild}
                                            rowHeight={ROW_HEIGHT}
                                            rowCount={signersHistory.length}
                                            rowRenderer={
                                                ({ key, index, style }) =>
                                                    this.getSignerHistoryRow(
                                                        signersHistory[index],
                                                        key,
                                                        style,
                                                        d.Server.isTestnet,
                                                    )}
                                        />
                                    )}
                                </InfiniteLoader>
                            )}
                        </AutoSizer>
                    </div>
                </div>
            </div>
        );
    }
}
ActivitySignersHistory.propTypes = {
    d: PropTypes.instanceOf(Driver).isRequired,
};
