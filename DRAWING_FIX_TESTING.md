# Drawing Coordinate Fix Testing

## Issue Description
When you circle/draw around skeleton nodes, the nodes that change color are not the ones you circled, but ones below that area.

## Root Cause
The drawing overlay covers the full screen height, but the skeleton is positioned in a centered container with height `SCREEN_HEIGHT * 0.8`. This creates a coordinate system mismatch.

## Fix Applied
1. **Coordinate Transformation**: Added logic to transform drawing coordinates to match skeleton coordinate system
2. **Container Offset Calculation**: Account for the vertical offset of the skeleton container
3. **Debug Logging**: Added detailed logging to help troubleshoot coordinate mapping

## Testing the Fix

### Step 1: Enable Debug Logging
The debug logs will now show in your console when you draw:
- Screen dimensions
- Drawing polygon points
- Skeleton node positions
- Container offset calculations
- Which nodes are found inside the polygon

### Step 2: Test Drawing
1. Start the app in skeleton mode (camera off)
2. Enable drawing mode
3. Draw a circle around a specific body part (e.g., head, shoulder)
4. Check the console logs to see the coordinate calculations
5. Verify that the correct nodes change color

### Step 3: Fine-tune if Needed
If the coordinates are still off, check the console logs for:
- `Container offset` value - should be around `(SCREEN_HEIGHT - SCREEN_HEIGHT * 0.8) / 2`
- Node positions vs drawing polygon points
- Whether the transformation is working correctly

## Manual Coordinate Check
You can manually verify coordinates by:
1. Tapping on a skeleton node to see its position
2. Drawing at that exact position
3. Comparing the logged coordinates

## Additional Notes
- The skeleton container is centered both horizontally and vertically
- The container has width `SCREEN_WIDTH * 0.95` and height `SCREEN_HEIGHT * 0.8`
- The skeleton SVG uses the same dimensions as the container
- Drawing overlay covers the full screen (width: SCREEN_WIDTH, height: SCREEN_HEIGHT)

## Next Steps
After testing, we can remove the debug logging and optimize the coordinate transformation for production.
