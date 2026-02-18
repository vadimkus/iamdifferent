from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from fredapi import Fred
import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
import os

app = Flask(__name__, static_folder='static')
CORS(app)

FRED_API_KEY = '2a948cee2bd38aff557c01946bfc5110'
fred = Fred(api_key=FRED_API_KEY)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def calc_rsi(series, period=14):
    delta = series.diff()
    gain = delta.where(delta > 0, 0.0)
    loss = -delta.where(delta < 0, 0.0)
    avg_gain = gain.rolling(window=period).mean()
    avg_loss = loss.rolling(window=period).mean()
    rs = avg_gain / avg_loss
    return 100 - (100 / (1 + rs))


def calc_ema(series, span):
    return series.ewm(span=span, adjust=False).mean()


def calc_macd(series):
    ema12 = calc_ema(series, 12)
    ema26 = calc_ema(series, 26)
    macd_line = ema12 - ema26
    signal = calc_ema(macd_line, 9)
    histogram = macd_line - signal
    return macd_line, signal, histogram


def calc_bollinger(series, period=20, std_dev=2):
    sma = series.rolling(window=period).mean()
    std = series.rolling(window=period).std()
    upper = sma + std_dev * std
    lower = sma - std_dev * std
    return upper, sma, lower


def nan_safe(val):
    if val is None or (isinstance(val, float) and np.isnan(val)):
        return None
    return round(float(val), 2)

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.route('/')
def index():
    return send_from_directory('static', 'index.html')


@app.route('/api/live')
def live_data():
    """Current BTC price + technical indicators."""
    try:
        btc = yf.download('BTC-USD', period='90d', interval='1d', progress=False)
        close = btc['Close']['BTC-USD']
        rsi = calc_rsi(close)
        macd_line, signal, histogram = calc_macd(close)
        bb_upper, bb_mid, bb_lower = calc_bollinger(close)
        ema_20 = calc_ema(close, 20)
        ema_50 = calc_ema(close, 50)
        sma_200 = close.rolling(200).mean()

        last = close.iloc[-1]
        prev = close.iloc[-2]
        change_pct = (last - prev) / prev * 100

        return jsonify({
            'price': nan_safe(last),
            'change_pct': nan_safe(change_pct),
            'rsi_14': nan_safe(rsi.iloc[-1]),
            'macd': nan_safe(macd_line.iloc[-1]),
            'macd_signal': nan_safe(signal.iloc[-1]),
            'macd_hist': nan_safe(histogram.iloc[-1]),
            'bb_upper': nan_safe(bb_upper.iloc[-1]),
            'bb_mid': nan_safe(bb_mid.iloc[-1]),
            'bb_lower': nan_safe(bb_lower.iloc[-1]),
            'ema_20': nan_safe(ema_20.iloc[-1]),
            'ema_50': nan_safe(ema_50.iloc[-1]),
            'sma_200': nan_safe(sma_200.iloc[-1]),
            'updated': datetime.utcnow().isoformat() + 'Z',
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/macro')
def macro_data():
    """FRED macro data: M2, Fed balance sheet, rates, CPI."""
    try:
        m2 = fred.get_series('M2SL', observation_start='2015-01-01')
        walcl = fred.get_series('WALCL', observation_start='2020-01-01')
        dff = fred.get_series('DFF', observation_start='2024-01-01')
        yc = fred.get_series('T10Y2Y', observation_start='2024-01-01')
        cpi = fred.get_series('CPIAUCSL', observation_start='2020-01-01')

        m2_latest = m2.dropna().iloc[-1]
        m2_prev = m2.dropna().iloc[-2]
        m2_yoy = ((m2_latest - m2.dropna().iloc[-13]) / m2.dropna().iloc[-13]) * 100

        walcl_latest = walcl.dropna().iloc[-1]
        dff_latest = dff.dropna().iloc[-1]
        yc_latest = yc.dropna().iloc[-1]

        m2_history = []
        for d, v in m2.dropna().items():
            m2_history.append({'date': d.isoformat(), 'value': round(float(v), 1)})

        return jsonify({
            'm2_latest': nan_safe(m2_latest),
            'm2_change_mom': nan_safe(m2_latest - m2_prev),
            'm2_yoy_pct': nan_safe(m2_yoy),
            'm2_history': m2_history,
            'fed_balance_sheet': nan_safe(walcl_latest / 1e6),
            'fed_funds_rate': nan_safe(dff_latest),
            'yield_curve_10y2y': nan_safe(yc_latest),
            'updated': datetime.utcnow().isoformat() + 'Z',
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/dxy')
def dxy_data():
    """US Dollar Index."""
    try:
        dxy = yf.download('DX-Y.NYB', period='90d', interval='1d', progress=False)
        close = dxy['Close']['DX-Y.NYB']
        last = close.iloc[-1]
        prev = close.iloc[-2]
        return jsonify({
            'dxy': nan_safe(last),
            'change_pct': nan_safe((last - prev) / prev * 100),
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/strategy')
def strategy_backtest():
    """Backtest: Buy 8PM UTC / Sell 2AM UTC (6AM Dubai)."""
    try:
        btc_h = yf.download('BTC-USD', period='730d', interval='1h', progress=False)
        close = btc_h['Close']['BTC-USD']

        buy_hour, sell_hour = 20, 2
        trades = []

        for date in close.index.normalize().unique():
            buy_mask = (close.index.normalize() == date) & (close.index.hour == buy_hour)
            next_date = date + pd.Timedelta(days=1)
            sell_mask = (close.index.normalize() == next_date) & (close.index.hour == sell_hour)

            if buy_mask.any() and sell_mask.any():
                bp = float(close[buy_mask].iloc[0])
                sp = float(close[sell_mask].iloc[0])
                ret = (sp - bp) / bp * 100
                trades.append({
                    'date': date.strftime('%Y-%m-%d'),
                    'buy': round(bp, 2),
                    'sell': round(sp, 2),
                    'return_pct': round(ret, 4),
                    'dow': date.day_name(),
                    'month': date.month,
                })

        df = pd.DataFrame(trades)
        wins = int((df['return_pct'] > 0).sum())
        losses = int((df['return_pct'] <= 0).sum())

        # Day-of-week breakdown
        dow_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        dow_stats = []
        for day in dow_order:
            d = df[df['dow'] == day]
            if len(d) > 0:
                dow_stats.append({
                    'day': day,
                    'trades': int(len(d)),
                    'win_rate': round(float((d['return_pct'] > 0).sum() / len(d) * 100), 1),
                    'avg_return': round(float(d['return_pct'].mean()), 4),
                    'cum_return': round(float(d['return_pct'].sum()), 2),
                })

        # Month breakdown
        month_names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
        month_stats = []
        for m in range(1, 13):
            d = df[df['month'] == m]
            if len(d) > 0:
                month_stats.append({
                    'month': month_names[m - 1],
                    'trades': int(len(d)),
                    'win_rate': round(float((d['return_pct'] > 0).sum() / len(d) * 100), 1),
                    'avg_return': round(float(d['return_pct'].mean()), 4),
                    'cum_return': round(float(d['return_pct'].sum()), 2),
                })

        # Equity curve (cumulative)
        equity = (1 + df['return_pct'] / 100).cumprod() * 10000
        eq_data = []
        for i, row in df.iterrows():
            eq_data.append({'date': row['date'], 'equity': round(float(equity.iloc[i]), 2)})

        # Recent 30 trades
        recent = df.tail(30).to_dict('records')

        return jsonify({
            'summary': {
                'total_trades': int(len(df)),
                'win_rate': round(wins / len(df) * 100, 1),
                'wins': wins,
                'losses': losses,
                'avg_return': round(float(df['return_pct'].mean()), 4),
                'median_return': round(float(df['return_pct'].median()), 4),
                'cum_return': round(float(df['return_pct'].sum()), 2),
                'max_win': round(float(df['return_pct'].max()), 2),
                'max_loss': round(float(df['return_pct'].min()), 2),
                'sharpe': round(float(df['return_pct'].mean() / df['return_pct'].std() * np.sqrt(365)), 2),
            },
            'by_day': dow_stats,
            'by_month': month_stats,
            'equity_curve': eq_data,
            'recent_trades': recent,
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/correlations')
def correlations():
    """BTC vs SPX vs Gold 1-year daily correlation."""
    try:
        tickers = {'BTC-USD': 'BTC', '^GSPC': 'SPX', 'GC=F': 'Gold'}
        frames = {}
        for sym, label in tickers.items():
            data = yf.download(sym, period='1y', interval='1d', progress=False)
            frames[label] = data['Close'][sym].pct_change()

        combined = pd.DataFrame(frames).dropna()
        corr = combined.corr()

        rolling_30 = combined['BTC'].rolling(30).corr(combined['SPX'])
        rolling_gold = combined['BTC'].rolling(30).corr(combined['Gold'])

        corr_history = []
        for d, v in rolling_30.dropna().items():
            gv = rolling_gold.get(d, None)
            corr_history.append({
                'date': d.strftime('%Y-%m-%d'),
                'btc_spx': round(float(v), 3),
                'btc_gold': round(float(gv), 3) if gv is not None and not np.isnan(gv) else None,
            })

        return jsonify({
            'matrix': {
                'btc_spx': nan_safe(corr.loc['BTC', 'SPX']),
                'btc_gold': nan_safe(corr.loc['BTC', 'Gold']),
                'spx_gold': nan_safe(corr.loc['SPX', 'Gold']),
            },
            'rolling_30d': corr_history,
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/sessions')
def session_analysis():
    """Hourly average BTC returns by UTC hour (session heatmap)."""
    try:
        btc_h = yf.download('BTC-USD', period='730d', interval='1h', progress=False)
        close = btc_h['Close']['BTC-USD']
        returns = close.pct_change() * 100

        hourly = []
        for h in range(24):
            mask = returns.index.hour == h
            r = returns[mask].dropna()
            hourly.append({
                'hour_utc': h,
                'hour_dubai': (h + 4) % 24,
                'avg_return': round(float(r.mean()), 4),
                'win_rate': round(float((r > 0).sum() / len(r) * 100), 1) if len(r) > 0 else 0,
                'volatility': round(float(r.std()), 4),
                'count': int(len(r)),
            })

        return jsonify({'hourly_stats': hourly})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    os.makedirs('static', exist_ok=True)
    app.run(host='0.0.0.0', port=5088, debug=True)
