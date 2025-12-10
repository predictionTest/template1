import React from 'react';
import {
    Grid,
    Card,
    CardContent,
    Typography,
    Box,
    LinearProgress
} from '@mui/material';
import { useStyles } from './styles';
import Nav from "../../components/Nav";

const Analytics = () => {
    const { classes } = useStyles();

    const marketStats = [
        { label: 'Total Volume', value: '1,234,567 USDT', change: '+12.5%' },
        { label: 'Floor Price', value: '950 USDT', change: '-2.3%' },
        { label: 'Total Holders', value: '3,456', change: '+8.7%' },
        { label: 'Avg. Price', value: '1,050 USDT', change: '+3.2%' },
    ];

    const distributionData = [
        { range: '1-5 NFTs', percentage: 65, count: 2250 },
        { range: '6-10 NFTs', percentage: 20, count: 692 },
        { range: '11-20 NFTs', percentage: 10, count: 346 },
        { range: '20+ NFTs', percentage: 5, count: 168 },
    ];

    const weeklyVolume = [
        { day: 'Mon', volume: 12450 },
        { day: 'Tue', volume: 18230 },
        { day: 'Wed', volume: 15890 },
        { day: 'Thu', volume: 22340 },
        { day: 'Fri', volume: 28670 },
        { day: 'Sat', volume: 31230 },
        { day: 'Sun', volume: 25190 },
    ];

    return (
        <>
            <div className={classes.wrapper}>
                <Nav page="Analytics" />
                <div className={classes.main}>
                    <div className={classes.header}>
                        <Typography variant="h3" className={classes.title}>
                            Market Analytics
                        </Typography>
                        <Typography variant="body1" className={classes.subtitle}>
                            Real-time market data and statistics
                        </Typography>
                    </div>

                    <Grid container spacing={3}>
                        {marketStats.map((stat, index) => (
                            <Grid item xs={12} sm={6} md={3} key={index}>
                                <Card className={classes.statCard}>
                                    <CardContent>
                                        <Typography variant="body2" className={classes.statLabel}>
                                            {stat.label}
                                        </Typography>
                                        <Typography variant="h5" className={classes.statValue}>
                                            {stat.value}
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            className={stat.change.startsWith('+') ? classes.positive : classes.negative}
                                        >
                                            {stat.change}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}

                        <Grid item xs={12} md={8}>
                            <Card className={classes.chartCard}>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Weekly Volume
                                    </Typography>
                                    <Box className={classes.chart}>
                                        {weeklyVolume.map((data, index) => (
                                            <Box key={index} className={classes.bar}>
                                                <Box
                                                    className={classes.barFill}
                                                    style={{
                                                        height: `${(data.volume / Math.max(...weeklyVolume.map(d => d.volume))) * 100}%`
                                                    }}
                                                />
                                                <Typography variant="caption" className={classes.barLabel}>
                                                    {data.day}
                                                </Typography>
                                                <Typography variant="caption" className={classes.barValue}>
                                                    {(data.volume / 1000).toFixed(1)}K
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Card className={classes.distributionCard}>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Holder Distribution
                                    </Typography>
                                    <Box className={classes.distributionList}>
                                        {distributionData.map((data, index) => (
                                            <Box key={index} className={classes.distributionItem}>
                                                <Box className={classes.distributionHeader}>
                                                    <Typography variant="body2">{data.range}</Typography>
                                                    <Typography variant="body2">{data.percentage}%</Typography>
                                                </Box>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={data.percentage}
                                                    className={classes.progressBar}
                                                />
                                                <Typography variant="caption" color="textSecondary">
                                                    {data.count} holders
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={12}>
                            <Card className={classes.infoCard}>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Market Insights
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} md={4}>
                                            <Box className={classes.insightBox}>
                                                <Typography variant="body2" color="textSecondary">
                                                    24h Volume
                                                </Typography>
                                                <Typography variant="h6">
                                                    145,890 USDT
                                                </Typography>
                                            </Box>
                                        </Grid>
                                        <Grid item xs={12} md={4}>
                                            <Box className={classes.insightBox}>
                                                <Typography variant="body2" color="textSecondary">
                                                    7d Volume
                                                </Typography>
                                                <Typography variant="h6">
                                                    1,234,567 USDT
                                                </Typography>
                                            </Box>
                                        </Grid>
                                        <Grid item xs={12} md={4}>
                                            <Box className={classes.insightBox}>
                                                <Typography variant="body2" color="textSecondary">
                                                    Total Trades
                                                </Typography>
                                                <Typography variant="h6">
                                                    8,234
                                                </Typography>
                                            </Box>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </div>
            </div>
        </>
    );
};

export default Analytics;

