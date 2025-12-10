import { makeStyles } from 'tss-react/mui';

export const useStyles = makeStyles()(() => ({
    wrapper: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
    main: {
        padding: '2rem',
        maxWidth: '1400px',
        margin: '0 auto',
    },
    header: {
        marginBottom: '2rem',
        textAlign: 'center',
    },
    title: {
        color: '#fff',
        fontWeight: 700,
        marginBottom: '0.5rem',
    },
    subtitle: {
        color: 'rgba(255,255,255,0.8)',
    },
    statCard: {
        background: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.2)',
    },
    statLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: '0.875rem',
        marginBottom: '0.5rem',
    },
    statValue: {
        color: '#fff',
        fontWeight: 700,
        marginBottom: '0.25rem',
    },
    positive: {
        color: '#10b981',
        fontWeight: 600,
    },
    negative: {
        color: '#ef4444',
        fontWeight: 600,
    },
    chartCard: {
        background: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.2)',
        height: '100%',
    },
    chart: {
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-around',
        height: '250px',
        marginTop: '1rem',
    },
    bar: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        flex: 1,
        maxWidth: '60px',
        height: '100%',
        justifyContent: 'flex-end',
    },
    barFill: {
        width: '100%',
        background: 'linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%)',
        borderRadius: '4px 4px 0 0',
        minHeight: '20px',
    },
    barLabel: {
        color: 'rgba(255,255,255,0.7)',
        marginTop: '0.5rem',
    },
    barValue: {
        color: 'rgba(255,255,255,0.9)',
        fontWeight: 600,
    },
    distributionCard: {
        background: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.2)',
        height: '100%',
    },
    distributionList: {
        marginTop: '1rem',
    },
    distributionItem: {
        marginBottom: '1.5rem',
    },
    distributionHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '0.5rem',
        color: 'rgba(255,255,255,0.9)',
    },
    progressBar: {
        height: '8px',
        borderRadius: '4px',
        backgroundColor: 'rgba(255,255,255,0.2)',
        marginBottom: '0.25rem',
        '& .MuiLinearProgress-bar': {
            backgroundColor: '#3b82f6',
        },
    },
    infoCard: {
        background: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.2)',
    },
    insightBox: {
        padding: '1rem',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '8px',
        '& .MuiTypography-h6': {
            color: '#fff',
            marginTop: '0.5rem',
        },
        '& .MuiTypography-body2': {
            color: 'rgba(255,255,255,0.7)',
        },
    },
}));

