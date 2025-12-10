import { makeStyles } from 'tss-react/mui';

export const useStyles = makeStyles()(() => ({
    wrapper: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
    main: {
        padding: '2rem',
        maxWidth: '1200px',
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
    connectPrompt: {
        textAlign: 'center',
        padding: '4rem 2rem',
        color: '#fff',
    },
    rewardCard: {
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        backdropFilter: 'blur(10px)',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.2)',
    },
    statsCard: {
        background: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.2)',
    },
    label: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: '0.875rem',
        marginBottom: '0.5rem',
    },
    value: {
        color: '#fff',
        fontWeight: 700,
        marginBottom: '1rem',
    },
    claimButton: {
        marginTop: '1rem',
        padding: '0.75rem',
        fontSize: '1rem',
        fontWeight: 600,
        background: '#fff',
        color: '#10b981',
        '&:hover': {
            background: 'rgba(255,255,255,0.9)',
        },
    },
    tableCard: {
        background: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.2)',
    },
    tableHeader: {
        color: 'rgba(255,255,255,0.9)',
        fontWeight: 600,
        borderBottom: '1px solid rgba(255,255,255,0.2)',
    },
    tableCell: {
        color: 'rgba(255,255,255,0.8)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
    },
    infoCard: {
        background: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.2)',
    },
    infoList: {
        color: 'rgba(255,255,255,0.8)',
        '& .MuiTypography-body2': {
            color: 'rgba(255,255,255,0.8)',
        },
    },
}));

