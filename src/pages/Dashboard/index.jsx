import React, { useState, useEffect } from 'react';
import { useAccount, useContractRead } from 'wagmi';
import { Button, Grid, Card, CardContent, Typography, Box } from '@mui/material';
import { useStyles } from './styles';
import Nav from "../../components/Nav";
import { NFT_ContractConfig } from "../../web3";

const Dashboard = () => {
    const { classes } = useStyles();
    const { address, isConnected } = useAccount();
    const [nftBalance, setNftBalance] = useState(0);
    const [totalSupply, setTotalSupply] = useState(0);

    const { data: balance } = useContractRead({
        ...NFT_ContractConfig,
        functionName: 'balanceOf',
        args: [address],
        watch: true,
    });

    const { data: supply } = useContractRead({
        ...NFT_ContractConfig,
        functionName: 'totalSupply',
        watch: true,
    });

    useEffect(() => {
        if (balance) setNftBalance(Number(balance));
        if (supply) setTotalSupply(Number(supply));
    }, [balance, supply]);

    const stats = [
        { label: 'Your NFTs', value: nftBalance, color: '#3766f1' },
        { label: 'Total Supply', value: totalSupply, color: '#10b981' },
        { label: 'Staked', value: 0, color: '#f59e0b' },
        { label: 'Rewards', value: '0 USDT', color: '#8b5cf6' },
    ];

    return (
        <>
            <div className={classes.wrapper}>
                <Nav page="Dashboard" />
                <div className={classes.main}>
                    <div className={classes.header}>
                        <Typography variant="h3" className={classes.title}>
                            Dashboard
                        </Typography>
                        <Typography variant="body1" className={classes.subtitle}>
                            Manage your NFT portfolio
                        </Typography>
                    </div>

                    <Grid container spacing={3} className={classes.statsGrid}>
                        {stats.map((stat, index) => (
                            <Grid item xs={12} sm={6} md={3} key={index}>
                                <Card className={classes.statCard}>
                                    <CardContent>
                                        <Typography variant="body2" className={classes.statLabel}>
                                            {stat.label}
                                        </Typography>
                                        <Typography
                                            variant="h4"
                                            className={classes.statValue}
                                            style={{ color: stat.color }}
                                        >
                                            {stat.value}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>

                    {!isConnected ? (
                        <Box className={classes.connectPrompt}>
                            <Typography variant="h5">
                                Connect your wallet to view your dashboard
                            </Typography>
                        </Box>
                    ) : (
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <Card className={classes.actionCard}>
                                    <CardContent>
                                        <Typography variant="h5" gutterBottom>
                                            Quick Actions
                                        </Typography>
                                        <Box className={classes.actionButtons}>
                                            <Button variant="contained" fullWidth>
                                                Buy More NFTs
                                            </Button>
                                            <Button variant="outlined" fullWidth>
                                                Stake NFTs
                                            </Button>
                                            <Button variant="outlined" fullWidth>
                                                Claim Rewards
                                            </Button>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <Card className={classes.actionCard}>
                                    <CardContent>
                                        <Typography variant="h5" gutterBottom>
                                            Recent Activity
                                        </Typography>
                                        <Box className={classes.activityList}>
                                            <Typography variant="body2" color="textSecondary">
                                                No recent activity
                                            </Typography>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    )}
                </div>
            </div>
        </>
    );
};

export default Dashboard;

