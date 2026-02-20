# Miami Architecture Pipeline Report

## Summary
- **City**: Miami, Florida
- **Total Buildings Processed**: 14  
- **Successful Downloads**: 2
- **Failed Downloads**: 12
- **Success Rate**: 14.3%
- **Total Image Size**: 333.8KB

## Successfully Submitted Buildings

### 1. Vizcaya Museum and Gardens
- **Wikipedia Source**: https://upload.wikimedia.org/wikipedia/commons/2/25/Villa_Vizcaya_20110228.jpg
- **File Size**: 320.3KB
- **Status**: ✅ Downloaded and optimized
- **Expected Style**: Italian Renaissance Revival villa architecture, 1916

### 2. Miami Tower
- **Wikipedia Source**: https://upload.wikimedia.org/wikipedia/en/6/6c/Miami_Tower_logo.png
- **File Size**: 13.5KB
- **Status**: ✅ Downloaded and optimized (logo image)
- **Expected Style**: Postmodern skyscraper architecture, 1987

## Issues Encountered - Rate Limiting Impact

### Failed Downloads Due to Rate Limiting (10)
- Fontainebleau Miami Beach: 429 Client Error - Too many requests
- Pérez Art Museum Miami: 429 Client Error - Too many requests  
- Brickell City Centre: 429 Client Error - Too many requests
- Adrienne Arsht Center: 429 Client Error - Too many requests
- Wolfsonian-FIU: 429 Client Error - Too many requests
- Bass Museum of Art: 429 Client Error - Too many requests
- Miami Beach Architectural District: 429 Client Error - Too many requests
- Coral Gables Biltmore Hotel: 429 Client Error - Too many requests

### No Wikipedia Images (4)
- Freedom Tower Miami: No image found
- Colony Hotel Miami Beach: No image found
- Bacardi Buildings: No image found
- Plymouth Congregational Church: No image found

## Rate Limiting Analysis
Miami was processed last in the sequence and experienced severe Wikipedia rate limiting. The specific error message indicates Wikipedia's protective measures were fully engaged:
- "429 Client Error: Too many requests"
- "Please contact noc@wikimedia.org to discuss a less disruptive approach"
- Suggested using thumbnail images from approved size list

## Expected Architectural Styles Not Captured
- Art Deco: Miami Beach Architectural District, Colony Hotel
- Mediterranean Revival: Coral Gables Biltmore, Freedom Tower  
- Contemporary: Pérez Art Museum, Adrienne Arsht Center
- Postmodern: Brickell City Centre
- Streamline Moderne: Fontainebleau

## Recommendations
1. Implement much longer delays between requests (5-10 seconds minimum)
2. Use Wikipedia's thumbnail API instead of full-resolution images
3. Process cities in smaller batches with cooling-off periods
4. Consider alternative image sources for rate-limited scenarios
5. Implement exponential backoff retry mechanisms

## Building IDs Obtained
*Note: Only 2 buildings successfully processed for submission*