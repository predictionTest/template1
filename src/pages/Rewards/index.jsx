import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import {
    Button,
    Grid,
    Card,
    CardContent,
    Typography,
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper
} from '@mui/material';
import { useStyles } from './styles';
import Nav from "../../components/Nav";

const Rewards = () => {
    const { classes } = useStyles();
    const { address, isConnected } = useAccount();
    const [pendingRewards, setPendingRewards] = useState('0');

    const rewardsHistory = [
        { date: '2024-01-15', amount: '100 USDT', type: 'Staking' },
        { date: '2024-01-10', amount: '75 USDT', type: 'Staking' },
        { date: '2024-01-05', amount: '50 USDT', type: 'Staking' },
    ];

    const handleClaimRewards = () => {
        console.log('Claiming rewards');
    };

    const calculateDailyRewards = () => {
        return '5.5';
    };

    const calculateMonthlyRewards = () => {
        return '165';
    };

    return (
        <>
            <div className={classes.wrapper}>
                <Nav page="Rewards" />
                <div className={classes.main}>
                    <div className={classes.header}>
                        <Typography variant="h3" className={classes.title}>
                            Rewards Center
                        </Typography>
                        <Typography variant="body1" className={classes.subtitle}>
                            Track and claim your staking rewards
                        </Typography>
                    </div>

                    {!isConnected ? (
                        <Box className={classes.connectPrompt}>
                            <Typography variant="h5">
                                Connect your wallet to view rewards
                            </Typography>
                        </Box>
                    ) : (
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={4}>
                                <Card className={classes.rewardCard}>
                                    <CardContent>
                                        <Typography variant="body2" className={classes.label}>
                                            Pending Rewards
                                        </Typography>
                                        <Typography variant="h3" className={classes.value}>
                                            {pendingRewards} USDT
                                        </Typography>
                                        <Button
                                            variant="contained"
                                            fullWidth
                                            onClick={handleClaimRewards}
                                            className={classes.claimButton}
                                        >
                                            Claim Rewards
                                        </Button>
                                    </CardContent>
                                </Card>
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <Card className={classes.statsCard}>
                                    <CardContent>
                                        <Typography variant="body2" className={classes.label}>
                                            Daily Rewards
                                        </Typography>
                                        <Typography variant="h4" className={classes.value}>
                                            {calculateDailyRewards()} USDT
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary">
                                            Estimated per day
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <Card className={classes.statsCard}>
                                    <CardContent>
                                        <Typography variant="body2" className={classes.label}>
                                            Monthly Rewards
                                        </Typography>
                                        <Typography variant="h4" className={classes.value}>
                                            {calculateMonthlyRewards()} USDT
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary">
                                            Estimated per month
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>

                            <Grid item xs={12}>
                                <Card className={classes.tableCard}>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                            Rewards History
                                        </Typography>
                                        <TableContainer>
                                            <Table>
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell className={classes.tableHeader}>Date</TableCell>
                                                        <TableCell className={classes.tableHeader}>Amount</TableCell>
                                                        <TableCell className={classes.tableHeader}>Type</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {rewardsHistory.map((reward, index) => (
                                                        <TableRow key={index}>
                                                            <TableCell className={classes.tableCell}>{reward.date}</TableCell>
                                                            <TableCell className={classes.tableCell}>{reward.amount}</TableCell>
                                                            <TableCell className={classes.tableCell}>{reward.type}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </CardContent>
                                </Card>
                            </Grid>

                            <Grid item xs={12}>
                                <Card className={classes.infoCard}>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                            Reward Information
                                        </Typography>
                                        <Box className={classes.infoList}>
                                            <Typography variant="body2" paragraph>
                                                • Rewards are distributed daily based on your staked NFTs
                                            </Typography>
                                            <Typography variant="body2" paragraph>
                                                • Current APY: 25%
                                            </Typography>
                                            <Typography variant="body2" paragraph>
                                                • Minimum claim amount: 1 USDT
                                            </Typography>
                                            <Typography variant="body2">
                                                • Rewards are paid in USDT
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

export default Rewards;

