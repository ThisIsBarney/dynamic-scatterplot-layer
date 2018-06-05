# @thisisbarney/dynamic-scatterplot-layer

a dynamic scatter plot layer, animating points

```jsx harmony
import React from 'react';
import DSLayer from '@thisisbarney/dynamic-scatterplot-layer';

const layers = [
  new DSLayer({
    // parameters same with ScatterplotLayer
    id: 'points',
    data,
    radiusScale: 1,
    getRadius: x => 100,
    getColor: d => [0, 255, 0],
    getPath: d => d.path,
    currentTime: time,
    maxSpeed: 5,
  })
];
```

Key parameters different from `ScatterplotLayer` is `getPath` and `curentTime`,
`getPath` maps a data row to a path consists of `[x, y, time]`,
`currentTime` corresponds with `time` in `path`.

`maxSpeed` is used to filter out invalid(too fast) points.