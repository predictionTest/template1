import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import {
    Button,
    Grid,
    Card,
    CardContent,
    Typography,
    Box,
    Tabs,
    Tab,
    TextField
} from '@mui/material';
import { useStyles } from './styles';
import Nav from "../../components/Nav";

const Staking = () => {
    const { classes } = useStyles();
    const { address, isConnected } = useAccount();
    const [activeTab, setActiveTab] = useState(0);
    const [stakeAmount, setStakeAmount] = useState('');
    const [unstakeAmount, setUnstakeAmount] = useState('');

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const handleStake = () => {
        console.log('Staking:', stakeAmount);
    };

    const handleUnstake = () => {
        console.log('Unstaking:', unstakeAmount);
    };

    return (
        <>
            <div className={classes.wrapper}>
                <Nav page="Staking" />
                <div className={classes.main}>
                    <div className={classes.header}>
                        <Typography variant="h3" className={classes.title}>
                            NFT Staking
                        </Typography>
                        <Typography variant="body1" className={classes.subtitle}>
                            Stake your NFTs to earn rewards
                        </Typography>
                    </div>

                    {!isConnected ? (
                        <Box className={classes.connectPrompt}>
                            <Typography variant="h5">
                                Connect your wallet to start staking
                            </Typography>
                        </Box>
                    ) : (
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={4}>
                                <Card className={classes.statsCard}>
                                    <CardContent>
                                        <Typography variant="body2" className={classes.statLabel}>
                                            Your Staked NFTs
                                        </Typography>
                                        <Typography variant="h4" className={classes.statValue}>
                                            0
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Card className={classes.statsCard}>
                                    <CardContent>
                                        <Typography variant="body2" className={classes.statLabel}>
                                            Total Rewards
                                        </Typography>
                                        <Typography variant="h4" className={classes.statValue}>
                                            0 USDT
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Card className={classes.statsCard}>
                                    <CardContent>
                                        <Typography variant="body2" className={classes.statLabel}>
                                            APY
                                        </Typography>
                                        <Typography variant="h4" className={classes.statValue}>
                                            25%
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>

                            <Grid item xs={12}>
                                <Card className={classes.mainCard}>
                                    <CardContent>
                                        <Tabs value={activeTab} onChange={handleTabChange} centered>
                                            <Tab label="Stake" />
                                            <Tab label="Unstake" />
                                        </Tabs>

                                        {activeTab === 0 && (
                                            <Box className={classes.tabContent}>
                                                <Typography variant="h6" gutterBottom>
                                                    Stake NFTs
                                                </Typography>
                                                <TextField
                                                    fullWidth
                                                    label="Number of NFTs"
                                                    type="number"
                                                    value={stakeAmount}
                                                    onChange={(e) => setStakeAmount(e.target.value)}
                                                    className={classes.input}
                                                />
                                                <Button
                                                    variant="contained"
                                                    fullWidth
                                                    onClick={handleStake}
                                                    className={classes.actionButton}
                                                >
                                                    Stake NFTs
                                                </Button>
                                            </Box>
                                        )}

                                        {activeTab === 1 && (
                                            <Box className={classes.tabContent}>
                                                <Typography variant="h6" gutterBottom>
                                                    Unstake NFTs
                                                </Typography>
                                                <TextField
                                                    fullWidth
                                                    label="Number of NFTs"
                                                    type="number"
                                                    value={unstakeAmount}
                                                    onChange={(e) => setUnstakeAmount(e.target.value)}
                                                    className={classes.input}
                                                />
                                                <Button
                                                    variant="contained"
                                                    fullWidth
                                                    onClick={handleUnstake}
                                                    className={classes.actionButton}
                                                >
                                                    Unstake NFTs
                                                </Button>
                                            </Box>
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>

                            <Grid item xs={12}>
                                <Card className={classes.mainCard}>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                            Your Staked NFTs
                                        </Typography>
                                        <Box className={classes.nftGrid}>
                                            <Typography color="textSecondary">
                                                No NFTs staked yet
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

export default Staking;

