/**
 * WhiteboardCanvas - Interactive drawing canvas component
 * Phase 15: Interactive Whiteboard System
 * Provides touch-based drawing with multiple tools and colors
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  PanResponder,
  Dimensions,
  StyleSheet,
  Text,
} from 'react-native';
import Svg, { Path, Rect, G, Circle, Line, Defs, Marker, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';

const { width, height } = Dimensions.get('window');

export interface DrawingPath {
  id: string;
  path: string;
  color: string;
  strokeWidth: number;
  tool: DrawingTool;
  opacity: number;
  timestamp: number;
}

export interface TextAnnotation {
  id: string;
  x: number;
  y: number;
  text: string;
  fontSize: number;
  color: string;
  fontFamily?: string;
  isMath?: boolean;
  latex?: string;
  timestamp: number;
}

export interface ShapeAnnotation {
  id: string;
  type: 'rectangle' | 'circle' | 'line' | 'arrow' | 'triangle' | 'ellipse';
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
  strokeWidth: number;
  fillColor?: string;
  timestamp: number;
}

export type DrawingTool = 'pen' | 'marker' | 'highlighter' | 'eraser' | 'text' | 'shape';

export type BackgroundType = 'blank' | 'grid' | 'lines' | 'dots';

interface WhiteboardCanvasProps {
  isTeacherView?: boolean;
  canDraw?: boolean;
  currentTool: DrawingTool;
  currentColor: string;
  strokeWidth: number;
  backgroundColor?: BackgroundType;
  onPathAdded?: (path: DrawingPath) => void;
  onPathsChanged?: (paths: DrawingPath[]) => void;
  paths?: DrawingPath[];
  textAnnotations?: TextAnnotation[];
  shapeAnnotations?: ShapeAnnotation[];
  onTextAdded?: (annotation: TextAnnotation) => void;
  onShapeAdded?: (annotation: ShapeAnnotation) => void;
  onTextAnnotationsChanged?: (annotations: TextAnnotation[]) => void;
  onShapeAnnotationsChanged?: (annotations: ShapeAnnotation[]) => void;
  selectedShapeType?: 'rectangle' | 'circle' | 'line' | 'arrow' | 'triangle' | 'ellipse';
  width?: number;
  height?: number;
  showGrid?: boolean;
}

const WhiteboardCanvas: React.FC<WhiteboardCanvasProps> = ({
  isTeacherView = false,
  canDraw = true,
  currentTool,
  currentColor,
  strokeWidth,
  backgroundColor = 'blank',
  onPathAdded,
  onPathsChanged,
  paths: externalPaths,
  textAnnotations: externalTextAnnotations,
  shapeAnnotations: externalShapeAnnotations,
  onTextAdded,
  onShapeAdded,
  onTextAnnotationsChanged,
  onShapeAnnotationsChanged,
  selectedShapeType = 'rectangle',
  width: canvasWidth = width * 0.95,
  height: canvasHeight = height * 0.6,
  showGrid = false,
}) => {
  const { theme } = useTheme();
  const [paths, setPaths] = useState<DrawingPath[]>(externalPaths || []);
  const [textAnnotations, setTextAnnotations] = useState<TextAnnotation[]>(externalTextAnnotations || []);
  const [shapeAnnotations, setShapeAnnotations] = useState<ShapeAnnotation[]>(externalShapeAnnotations || []);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentShape, setCurrentShape] = useState<ShapeAnnotation | null>(null);
  const [isDrawingShape, setIsDrawingShape] = useState(false);

  // Sync external data
  useEffect(() => {
    if (externalPaths) {
      setPaths(externalPaths);
    }
  }, [externalPaths]);

  useEffect(() => {
    if (externalTextAnnotations) {
      setTextAnnotations(externalTextAnnotations);
    }
  }, [externalTextAnnotations]);

  useEffect(() => {
    if (externalShapeAnnotations) {
      setShapeAnnotations(externalShapeAnnotations);
    }
  }, [externalShapeAnnotations]);

  const generatePathId = useCallback(() => {
    return `path_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const generateAnnotationId = useCallback(() => {
    return `annotation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const getToolOpacity = useCallback((tool: DrawingTool) => {
    switch (tool) {
      case 'highlighter':
        return 0.4;
      case 'marker':
        return 0.8;
      case 'pen':
      case 'eraser':
      case 'text':
      case 'shape':
      default:
        return 1.0;
    }
  }, []);

  const getToolStrokeWidth = useCallback((tool: DrawingTool, baseWidth: number) => {
    switch (tool) {
      case 'highlighter':
        return baseWidth * 3;
      case 'marker':
        return baseWidth * 2;
      case 'pen':
        return baseWidth;
      case 'eraser':
        return baseWidth * 4;
      default:
        return baseWidth;
    }
  }, []);

  const handlePathComplete = useCallback((pathString: string) => {
    if (pathString.length > 10) { // Only save meaningful paths
      const newPath: DrawingPath = {
        id: generatePathId(),
        path: pathString,
        color: currentTool === 'eraser' ? theme.Surface : currentColor,
        strokeWidth: getToolStrokeWidth(currentTool, strokeWidth),
        tool: currentTool,
        opacity: getToolOpacity(currentTool),
        timestamp: Date.now(),
      };

      const updatedPaths = [...paths, newPath];
      setPaths(updatedPaths);
      onPathAdded?.(newPath);
      onPathsChanged?.(updatedPaths);
    }
  }, [
    paths,
    currentTool,
    currentColor,
    strokeWidth,
    theme.Surface,
    generatePathId,
    getToolStrokeWidth,
    getToolOpacity,
    onPathAdded,
    onPathsChanged,
  ]);

  const handleTextAnnotation = useCallback((x: number, y: number) => {
    // For text tool, we'll handle this in the UI layer with a modal
    console.log('Text annotation requested at:', x, y);
  }, []);

  const handleShapeStart = useCallback((x: number, y: number) => {
    if (currentTool === 'shape') {
      const newShape: ShapeAnnotation = {
        id: generateAnnotationId(),
        type: selectedShapeType,
        startX: x,
        startY: y,
        endX: x,
        endY: y,
        color: currentColor,
        strokeWidth: strokeWidth,
        timestamp: Date.now(),
      };
      setCurrentShape(newShape);
      setIsDrawingShape(true);
    }
  }, [currentTool, selectedShapeType, currentColor, strokeWidth, generateAnnotationId]);

  const handleShapeMove = useCallback((x: number, y: number) => {
    if (isDrawingShape && currentShape) {
      setCurrentShape(prev => prev ? { ...prev, endX: x, endY: y } : null);
    }
  }, [isDrawingShape, currentShape]);

  const handleShapeComplete = useCallback(() => {
    if (isDrawingShape && currentShape) {
      const updatedShapes = [...shapeAnnotations, currentShape];
      setShapeAnnotations(updatedShapes);
      onShapeAdded?.(currentShape);
      onShapeAnnotationsChanged?.(updatedShapes);
      setCurrentShape(null);
      setIsDrawingShape(false);
    }
  }, [isDrawingShape, currentShape, shapeAnnotations, onShapeAdded, onShapeAnnotationsChanged]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => canDraw,
      onMoveShouldSetPanResponder: () => canDraw,

      onPanResponderGrant: (evt) => {
        if (!canDraw) return;
        
        const { locationX, locationY } = evt.nativeEvent;
        
        if (currentTool === 'text') {
          handleTextAnnotation(locationX, locationY);
          return;
        }
        
        if (currentTool === 'shape') {
          handleShapeStart(locationX, locationY);
          return;
        }
        
        // Regular drawing tools
        setIsDrawing(true);
        const newPath = `M${locationX.toFixed(1)},${locationY.toFixed(1)}`;
        setCurrentPath(newPath);
      },

      onPanResponderMove: (evt) => {
        if (!canDraw) return;
        
        const { locationX, locationY } = evt.nativeEvent;
        
        if (currentTool === 'shape' && isDrawingShape) {
          handleShapeMove(locationX, locationY);
          return;
        }
        
        if (!isDrawing) return;
        
        // Regular drawing tools
        setCurrentPath(prev => `${prev} L${locationX.toFixed(1)},${locationY.toFixed(1)}`);
      },

      onPanResponderRelease: () => {
        if (!canDraw) return;
        
        if (currentTool === 'shape' && isDrawingShape) {
          handleShapeComplete();
          return;
        }
        
        if (!isDrawing) return;
        
        // Regular drawing tools
        setIsDrawing(false);
        handlePathComplete(currentPath);
        setCurrentPath('');
      },

      onPanResponderTerminate: () => {
        setIsDrawing(false);
        setIsDrawingShape(false);
        setCurrentPath('');
        setCurrentShape(null);
      },
    })
  ).current;

  const renderBackground = () => {
    switch (backgroundColor) {
      case 'grid':
        return renderGrid();
      case 'lines':
        return renderLines();
      case 'dots':
        return renderDots();
      case 'blank':
      default:
        return (
          <Rect
            width={canvasWidth}
            height={canvasHeight}
            fill={theme.Surface}
            stroke={theme.Outline}
            strokeWidth={1}
          />
        );
    }
  };

  const renderGrid = () => {
    const gridSize = 20;
    const gridPaths = [];

    // Vertical lines
    for (let x = 0; x <= canvasWidth; x += gridSize) {
      gridPaths.push(`M${x},0 L${x},${canvasHeight}`);
    }

    // Horizontal lines
    for (let y = 0; y <= canvasHeight; y += gridSize) {
      gridPaths.push(`M0,${y} L${canvasWidth},${y}`);
    }

    return (
      <G>
        <Rect
          width={canvasWidth}
          height={canvasHeight}
          fill={theme.Surface}
        />
        {gridPaths.map((pathData, index) => (
          <Path
            key={`grid-${index}`}
            d={pathData}
            stroke={theme.Outline}
            strokeWidth={0.5}
            opacity={0.3}
          />
        ))}
      </G>
    );
  };

  const renderLines = () => {
    const lineSpacing = 30;
    const linePaths = [];

    for (let y = lineSpacing; y <= canvasHeight; y += lineSpacing) {
      linePaths.push(`M0,${y} L${canvasWidth},${y}`);
    }

    return (
      <G>
        <Rect
          width={canvasWidth}
          height={canvasHeight}
          fill={theme.Surface}
        />
        {linePaths.map((pathData, index) => (
          <Path
            key={`line-${index}`}
            d={pathData}
            stroke={theme.Outline}
            strokeWidth={0.8}
            opacity={0.4}
          />
        ))}
      </G>
    );
  };

  const renderDots = () => {
    const dotSpacing = 20;
    const dots = [];

    for (let x = dotSpacing; x < canvasWidth; x += dotSpacing) {
      for (let y = dotSpacing; y < canvasHeight; y += dotSpacing) {
        dots.push({ x, y });
      }
    }

    return (
      <G>
        <Rect
          width={canvasWidth}
          height={canvasHeight}
          fill={theme.Surface}
        />
        {dots.map((dot, index) => (
          <Path
            key={`dot-${index}`}
            d={`M${dot.x},${dot.y} L${dot.x + 0.5},${dot.y}`}
            stroke={theme.Outline}
            strokeWidth={1}
            opacity={0.4}
          />
        ))}
      </G>
    );
  };

  const renderShape = (shape: ShapeAnnotation) => {
    const { type, startX, startY, endX, endY, color, strokeWidth } = shape;
    
    switch (type) {
      case 'rectangle':
        return (
          <Rect
            x={Math.min(startX, endX)}
            y={Math.min(startY, endY)}
            width={Math.abs(endX - startX)}
            height={Math.abs(endY - startY)}
            fill="transparent"
            stroke={color}
            strokeWidth={strokeWidth}
          />
        );
        
      case 'circle':
        const centerX = (startX + endX) / 2;
        const centerY = (startY + endY) / 2;
        const radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)) / 2;
        return (
          <Circle
            cx={centerX}
            cy={centerY}
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth={strokeWidth}
          />
        );
        
      case 'line':
        return (
          <Line
            x1={startX}
            y1={startY}
            x2={endX}
            y2={endY}
            stroke={color}
            strokeWidth={strokeWidth}
          />
        );
        
      case 'arrow':
        const angle = Math.atan2(endY - startY, endX - startX);
        const arrowLength = 15;
        const arrowAngle = Math.PI / 6;
        
        const arrowX1 = endX - arrowLength * Math.cos(angle - arrowAngle);
        const arrowY1 = endY - arrowLength * Math.sin(angle - arrowAngle);
        const arrowX2 = endX - arrowLength * Math.cos(angle + arrowAngle);
        const arrowY2 = endY - arrowLength * Math.sin(angle + arrowAngle);
        
        return (
          <G>
            <Line
              x1={startX}
              y1={startY}
              x2={endX}
              y2={endY}
              stroke={color}
              strokeWidth={strokeWidth}
            />
            <Path
              d={`M${endX},${endY} L${arrowX1},${arrowY1} M${endX},${endY} L${arrowX2},${arrowY2}`}
              stroke={color}
              strokeWidth={strokeWidth}
            />
          </G>
        );
        
      case 'triangle':
        const midX = (startX + endX) / 2;
        return (
          <Path
            d={`M${midX},${startY} L${endX},${endY} L${startX},${endY} Z`}
            fill="transparent"
            stroke={color}
            strokeWidth={strokeWidth}
          />
        );
        
      case 'ellipse':
        const ellipseCenterX = (startX + endX) / 2;
        const ellipseCenterY = (startY + endY) / 2;
        const radiusX = Math.abs(endX - startX) / 2;
        const radiusY = Math.abs(endY - startY) / 2;
        return (
          <Circle
            cx={ellipseCenterX}
            cy={ellipseCenterY}
            rx={radiusX}
            ry={radiusY}
            fill="transparent"
            stroke={color}
            strokeWidth={strokeWidth}
          />
        );
        
      default:
        return null;
    }
  };

  if (!canDraw && !isTeacherView) {
    return (
      <View style={styles.disabledContainer}>
        <Text style={[styles.disabledText, { color: theme.OnSurfaceVariant }]}>
          Drawing is disabled. Only the teacher can draw on the whiteboard.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.canvas,
          {
            width: canvasWidth,
            height: canvasHeight,
            backgroundColor: theme.Surface,
          },
        ]}
        {...panResponder.panHandlers}
      >
        <Svg
          width={canvasWidth}
          height={canvasHeight}
          style={styles.svgCanvas}
        >
          {renderBackground()}
          
          {/* Render all completed paths */}
          {paths.map((pathData) => (
            <Path
              key={pathData.id}
              d={pathData.path}
              stroke={pathData.color}
              strokeWidth={pathData.strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="transparent"
              opacity={pathData.opacity}
            />
          ))}
          
          {/* Render shape annotations */}
          {shapeAnnotations.map((shape) => (
            <G key={shape.id}>
              {renderShape(shape)}
            </G>
          ))}
          
          {/* Render current shape being drawn */}
          {currentShape && isDrawingShape && (
            <G>
              {renderShape(currentShape)}
            </G>
          )}
          
          {/* Render text annotations */}
          {textAnnotations.map((annotation) => (
            <SvgText
              key={annotation.id}
              x={annotation.x}
              y={annotation.y}
              fontSize={annotation.fontSize}
              fill={annotation.color}
              fontFamily={annotation.fontFamily || 'Arial'}
            >
              {annotation.text}
            </SvgText>
          ))}
          
          {/* Render current drawing path */}
          {currentPath && isDrawing && (
            <Path
              d={currentPath}
              stroke={currentTool === 'eraser' ? theme.Surface : currentColor}
              strokeWidth={getToolStrokeWidth(currentTool, strokeWidth)}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="transparent"
              opacity={getToolOpacity(currentTool)}
            />
          )}
        </Svg>
      </View>

      {!canDraw && (
        <View style={styles.readOnlyOverlay}>
          <Text style={[styles.readOnlyText, { color: theme.primary }]}>
            Read Only
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  canvas: {
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  svgCanvas: {
    borderRadius: 8,
  },
  disabledContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  disabledText: {
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  readOnlyOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  readOnlyText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default WhiteboardCanvas;