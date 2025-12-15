# Frontend Configuration Guide

## Chunk Size Configuration

The frontend uses several configurable parameters to optimize blockchain data loading while avoiding gas limits.

### Configuration Parameters

#### 1. `chunkSize` (default: 5000)
Main block range chunk size for scanning the blockchain.
- **What it does**: Scans blocks in chunks to find polls
- **Trade-off**: Larger = faster, but may hit gas limits
- **Recommended**: 5000-8000 blocks

```typescript
// In contract.ts
chunkSize: 5000

// Or via environment variable
VITE_CHUNK_SIZE=8000
```

#### 2. `cacheChunkSize` (default: 20)
Number of specific blocks to load at once when reading from cache.
- **What it does**: When loading cached poll blocks, loads them in batches
- **Important**: These are specific block numbers, not ranges
- **Trade-off**: Larger = faster, but may hit gas limits if blocks have many polls
- **Recommended**: 10-30 blocks

```typescript
// In contract.ts
cacheChunkSize: 20

// Or via environment variable
VITE_CACHE_CHUNK_SIZE=20
```

#### 3. `minRetryChunkSize` (default: 50)
Minimum chunk size when retrying failed requests.
- **What it does**: If a request fails, automatically retries with smaller chunks
- **Retry logic**: Halves chunk size on each retry until reaching minimum
- **Trade-off**: Smaller = more reliable, but slower on failure
- **Recommended**: 50-100 blocks

```typescript
// In contract.ts
minRetryChunkSize: 50

// Or via environment variable
VITE_MIN_RETRY_CHUNK_SIZE=50
```

## How Retry Logic Works

When a blockchain read fails (usually due to gas limits):

1. **First attempt**: Uses full chunk size
2. **On failure**: Retries with chunk size / 2
3. **On failure again**: Retries with chunk size / 4
4. **Continues**: Until reaching `minRetryChunkSize`
5. **Max retries**: 3 attempts total

### Example

```
chunkSize = 5000 blocks
minRetryChunkSize = 50 blocks

Attempt 1: Load 5000 blocks → FAIL (gas limit)
Attempt 2: Load 2500 blocks → FAIL (gas limit) 
Attempt 3: Load 1250 blocks → SUCCESS
Remaining: Load 2500 blocks recursively (with same retry logic)
```

## Cache Loading Strategy

### Two-Tier Cache System

1. **Confirmed blocks**: Polls with resolved status (Yes/No/Unknown)
2. **Future blocks**: Polls still pending resolution

### Loading Process

```typescript
// Step 1: Load all cached blocks in small chunks
for (chunk of cachedBlocks.inChunksOf(cacheChunkSize)) {
  polls = await loadChunkWithRetry(chunk)
  // Auto-adapts chunk size if needed
}

// Step 2: Scan new blocks since last cache
startFrom = cacheLoadSuccessful ? cache.lastCheckedBlock : deploymentBlock
scanBlocks(startFrom, currentBlock)
```

## Gas Limit Considerations

### Why Different Chunk Sizes?

1. **Block Range Scanning** (`chunkSize`):
   - Contract function: `getPollsByBlockRange(fromBlock, toBlock)`
   - Iterates through block range
   - Can handle larger chunks (5000+ blocks)
   - Most blocks have 0 polls = cheap

2. **Cache Loading** (`cacheChunkSize`):
   - Contract function: `getPollsByBlocks([block1, block2, ...])`
   - Loads specific blocks (we know they have polls!)
   - Every block has 1-22 polls = expensive
   - Needs smaller chunks (10-30 blocks)

### Real-World Example

From your logs:
```
blocksWithMultiplePolls: [
  [22 polls in one block],  // Very expensive!
  [2 polls], [2 polls], [2 polls], [2 polls]
]
```

Loading 20 blocks with average 2 polls each = 40 external contract calls
Loading 50 blocks could hit gas limits if unlucky with poll distribution

## Tuning for Your Network

### For Networks with High Gas Limits
```env
VITE_CHUNK_SIZE=10000
VITE_CACHE_CHUNK_SIZE=50
VITE_MIN_RETRY_CHUNK_SIZE=100
```

### For Networks with Low Gas Limits
```env
VITE_CHUNK_SIZE=2000
VITE_CACHE_CHUNK_SIZE=10
VITE_MIN_RETRY_CHUNK_SIZE=25
```

### For Many Polls Per Block
```env
VITE_CHUNK_SIZE=5000  # Main scan can stay large
VITE_CACHE_CHUNK_SIZE=10  # Reduce cache chunks
VITE_MIN_RETRY_CHUNK_SIZE=50
```

## Monitoring

Watch console logs for:

```javascript
// Success indicators
"Loaded from cache: {pollsReturned: 247}"
"AllPolls scanning complete: {totalPollsFound: 247}"

// Retry indicators (normal, not errors!)
"Retrying block range with smaller chunk: 2500 blocks (attempt 1/3)"

// Warnings (indicates persistent issues)
"Failed to load chunk after 3 attempts, skipping 10 blocks"
```

## Best Practices

1. **Start Conservative**: Use default values (5000, 20, 50)
2. **Monitor Logs**: Watch for frequent retries
3. **Tune Gradually**: Increase by 25-50% if no issues
4. **Cache is Critical**: Smaller `cacheChunkSize` is safer
5. **Test After Changes**: Clear cache and reload to verify

## Troubleshooting

### Problem: Frequent Retries
```
Retrying block range with smaller chunk: 2500 blocks (attempt 1/3)
Retrying block range with smaller chunk: 1250 blocks (attempt 2/3)
```
**Solution**: Reduce `chunkSize` by 25%

### Problem: Cache Loading Fails
```
Error loading from cache: ContractFunctionExecutionError
```
**Solution**: Reduce `cacheChunkSize` (try 10)

### Problem: Missing Polls
```
AllPolls: 247 polls
Stats: 172 polls  // ❌ Different!
```
**Solution**: Clear cache, will trigger full rescan from deployment block

### Problem: Very Slow Loading
**Solution**: Increase chunk sizes, but monitor for errors

