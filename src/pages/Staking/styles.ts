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
    statsCard: {
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
    mainCard: {
        background: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.2)',
    },
    tabContent: {
        padding: '2rem 0',
    },
    input: {
        marginBottom: '1.5rem',
        '& .MuiOutlinedInput-root': {
            color: '#fff',
            '& fieldset': {
                borderColor: 'rgba(255,255,255,0.3)',
            },
            '&:hover fieldset': {
                borderColor: 'rgba(255,255,255,0.5)',
            },
        },
        '& .MuiInputLabel-root': {
            color: 'rgba(255,255,255,0.7)',
        },
    },
    actionButton: {
        padding: '1rem',
        fontSize: '1rem',
        fontWeight: 600,
    },
    nftGrid: {
        minHeight: '200px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
}));

