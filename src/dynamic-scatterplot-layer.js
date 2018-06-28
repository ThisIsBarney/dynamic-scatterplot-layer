/* eslint-disable no-plusplus,no-restricted-globals,no-param-reassign,prefer-destructuring */
// @flow
import { Layer } from 'deck.gl';
import { GL, Model, Geometry } from 'luma.gl';

import vs from './dynamic-scatterplot-layer.vert';
import fs from './dynamic-scatterplot-layer.frag';

const DEFAULT_COLOR = [0, 0, 0, 255];

const defaultProps = {
  radiusScale: 1,
  radiusMinPixels: 0, //  min point radius in pixels
  radiusMaxPixels: Number.MAX_SAFE_INTEGER, // max point radius in pixels
  strokeWidth: 1,
  outline: false,
  currentTime: 0,
  maxSpeed: Number.MAX_SAFE_INTEGER,
  maxDistance: Number.MAX_SAFE_INTEGER,
  zoom: 1,
  fadeInTime: Number.MAX_SAFE_INTEGER,

  getPosition: x => x.position,
  getPath: x => x.path,
  getRadius: x => x.radius || 1,
  getColor: x => x.color || DEFAULT_COLOR,
};

export default class DynamicScatterPlotLayer extends Layer {
  getShaders() {
    return { vs, fs, modules: ['picking'] }; // 'project' module added by default.
  }

  initializeState() {
    const { gl } = this.context;
    this.setState({ model: this.getModel(gl) });
    const { attributeManager } = this.state;
    attributeManager.addInstanced({
      instanceRadius: {
        size: 1,
        accessor: 'getRadius',
        defaultValue: 1,
        update: this.calculateRadius,
      },
      instanceColors: {
        size: 4,
        type: GL.UNSIGNED_BYTE,
        accessor: 'getColor',
        update: this.calculateColors,
      },
      instanceStartPositions: {
        size: 3,
        update: this.calculateStartPositions,
      },
      instanceEndPositions: {
        size: 3,
        update: this.calculateEndPositions,
      },
      instancePickingColors: {
        size: 3,
        type: GL.UNSIGNED_BYTE,
        update: this.calculatePickingColors,
      },
      instanceIsLastSegment: {
        size: 1,
        update: this.calculateLastSegment,
      },
    });
  }

  updateState({ oldProps, props, changeFlags }: {oldProps: any, props: any, changeFlags: {dataChanged: boolean}}) {
    super.updateState({ props, oldProps, changeFlags });

    const { getPath } = this.props;
    const { attributeManager } = this.state;
    if (changeFlags.dataChanged) {
      const paths = props.data.map(getPath);
      const numInstances = paths.reduce((count, path) => count + (path.length - 1), 0);

      this.setState({ paths, numInstances });
      attributeManager.invalidateAll();
    }
  }

  draw({ uniforms }) {
    const {
      radiusScale,
      radiusMinPixels,
      radiusMaxPixels,
      outline,
      strokeWidth,
      currentTime,
      maxSpeed,
      maxDistance,
      zoom,
      fadeInTime,
    } = this.props;

    this.state.model.render(Object.assign({}, uniforms, {
      outline: outline ? 1 : 0,
      strokeWidth,
      radiusScale,
      radiusMinPixels,
      radiusMaxPixels,
      currentTime,
      maxSpeed,
      maxDistance,
      zoom,
      fadeInTime,
    }));
  }

  getModel(gl) {
    // a square that minimally cover the unit circle
    const positions = [-1, -1, 0, -1, 1, 0, 1, 1, 0, 1, -1, 0];

    return new Model(
      gl,
      Object.assign(this.getShaders(), {
        id: this.props.id,
        geometry: new Geometry({
          drawMode: GL.TRIANGLE_FAN,
          attributes: {
            positions: new Float32Array(positions),
          },
        }),
        isInstanced: true,
        shaderCache: this.context.shaderCache,
      })
    );
  }

  calculateRadius(attribute) {
    const { data, getRadius } = this.props;
    const { paths } = this.state;
    const { value } = attribute;

    let i = 0;
    paths.forEach((path, index) => {
      const radius = getRadius(data[index], index);
      for (let ptIndex = 1; ptIndex < path.length; ptIndex++) {
        value[i++] = radius;
      }
    });
  }

  calculateColors(attribute: {value: Array<number>}) {
    const { data, getColor } = this.props;
    const { paths } = this.state;
    const { value } = attribute;

    let i = 0;
    paths.forEach((path, index) => {
      const pointColor = getColor(data[index], index);
      if (isNaN(pointColor[3])) {
        pointColor[3] = 255;
      }
      for (let ptIndex = 1; ptIndex < path.length; ptIndex++) {
        value[i++] = pointColor[0];
        value[i++] = pointColor[1];
        value[i++] = pointColor[2];
        value[i++] = pointColor[3];
      }
    });
  }

  calculateStartPositions(attribute: {value: Array<number>}) {
    const { paths } = this.state;
    const { value } = attribute;

    let i = 0;
    paths.forEach(path => {
      const numSegments = path.length - 1;
      for (let ptIndex = 0; ptIndex < numSegments; ptIndex++) {
        const point = path[ptIndex];
        value[i++] = point[0];
        value[i++] = point[1];
        value[i++] = point[2] || 0;
      }
    });
  }

  calculateEndPositions(attribute: {value: Array<number>}) {
    const { paths } = this.state;
    const { value } = attribute;

    let i = 0;
    paths.forEach(path => {
      for (let ptIndex = 1; ptIndex < path.length; ptIndex++) {
        const point = path[ptIndex];
        value[i++] = point[0];
        value[i++] = point[1];
        value[i++] = point[2] || 0;
      }
    });
  }

  calculatePickingColors(attribute: {value: Array<number>}) {
    const { paths } = this.state;
    const { value } = attribute;

    let i = 0;
    paths.forEach((path, index) => {
      const pickingColor = this.encodePickingColor(index);
      for (let ptIndex = 1; ptIndex < path.length; ptIndex++) {
        value[i++] = pickingColor[0];
        value[i++] = pickingColor[1];
        value[i++] = pickingColor[2];
      }
    });
  }

  calculateLastSegment(attribute) {
    const { paths } = this.state;
    const { value } = attribute;

    let i = 0;
    paths.forEach(path => {
      for (let ptIndex = 0; ptIndex < path.length; ptIndex++) {
        if (ptIndex === path.length - 1) {
          value[i++] = 1;
        } else {
          value[i++] = 0;
        }
      }
    });
  }
}

DynamicScatterPlotLayer.layerName = 'DynamicScatterPlotLayer';
DynamicScatterPlotLayer.defaultProps = defaultProps;
