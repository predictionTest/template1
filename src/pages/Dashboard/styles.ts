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
    statsGrid: {
        marginBottom: '2rem',
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
    },
    connectPrompt: {
        textAlign: 'center',
        padding: '4rem 2rem',
        color: '#fff',
    },
    actionCard: {
        background: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.2)',
    },
    actionButtons: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        marginTop: '1rem',
    },
    activityList: {
        marginTop: '1rem',
        minHeight: '200px',
    },
}));

