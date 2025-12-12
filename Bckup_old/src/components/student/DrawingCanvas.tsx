/**
 * DrawingCanvas - Interactive Drawing Canvas for Problem Visualization
 * Phase 21: Media Integration System
 * Provides drawing tools for sketching diagrams, solving problems, and visual explanations
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  PanResponder,
  Dimensions,
  TouchableOpacity,
  Text,
  Alert,
} from 'react-native';
import Svg, {
  Path,
  Circle,
  Line,
  Rect,
  G,
  Defs,
  Pattern,
} from 'react-native-svg';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../context/ThemeContext';

export interface DrawingPath {
  id: string;
  d: string;
  stroke: string;
  strokeWidth: number;
  strokeOpacity: number;
  tool: DrawingTool;
  timestamp: number;
}

export interface DrawingShape {
  id: string;
  type: 'circle' | 'rectangle' | 'line' | 'arrow';
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  stroke: string;
  strokeWidth: number;
  fill?: string;
  timestamp: number;
}

export type DrawingTool = 'pen' | 'pencil' | 'marker' | 'highlighter' | 'eraser' | 'line' | 'rectangle' | 'circle' | 'arrow';

export interface DrawingCanvasProps {
  width?: number;
  height?: number;
  onDrawingChanged?: (paths: DrawingPath[], shapes: DrawingShape[]) => void;
  onExportImage?: (base64: string) => void;
  initialPaths?: DrawingPath[];
  initialShapes?: DrawingShape[];
  readOnly?: boolean;
  showGrid?: boolean;
  showRuler?: boolean;
  backgroundColor?: string;
}

const { width: screenWidth } = Dimensions.get('window');
const DEFAULT_CANVAS_WIDTH = screenWidth - 32;
const DEFAULT_CANVAS_HEIGHT = 300;

const DRAWING_TOOLS = {
  pen: { strokeWidth: 2, opacity: 1.0, color: '#000000' },
  pencil: { strokeWidth: 1, opacity: 0.8, color: '#666666' },
  marker: { strokeWidth: 6, opacity: 0.7, color: '#FF6B6B' },
  highlighter: { strokeWidth: 12, opacity: 0.3, color: '#FFEB3B' },
  eraser: { strokeWidth: 10, opacity: 1.0, color: 'transparent' },
  line: { strokeWidth: 2, opacity: 1.0, color: '#000000' },
  rectangle: { strokeWidth: 2, opacity: 1.0, color: '#000000' },
  circle: { strokeWidth: 2, opacity: 1.0, color: '#000000' },
  arrow: { strokeWidth: 2, opacity: 1.0, color: '#000000' },
};

const COLORS = [
  '#000000', // Black
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#FECA57', // Yellow
  '#FF9FF3', // Pink
  '#54A0FF', // Light Blue
  '#5F27CD', // Purple
  '#00D2D3', // Cyan
];

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  width = DEFAULT_CANVAS_WIDTH,
  height = DEFAULT_CANVAS_HEIGHT,
  onDrawingChanged,
  onExportImage,
  initialPaths = [],
  initialShapes = [],
  readOnly = false,
  showGrid = true,
  showRuler = false,
  backgroundColor = 'white',
}) => {
  const { theme } = useTheme();
  
  const [paths, setPaths] = useState<DrawingPath[]>(initialPaths);
  const [shapes, setShapes] = useState<DrawingShape[]>(initialShapes);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [currentTool, setCurrentTool] = useState<DrawingTool>('pen');
  const [currentColor, setCurrentColor] = useState('#000000');
  const [isDrawing, setIsDrawing] = useState(false);
  const [showTools, setShowTools] = useState(false);
  
  // Shape drawing state
  const [tempShape, setTempShape] = useState<DrawingShape | null>(null);
  const [shapeStartPoint, setShapeStartPoint] = useState<{ x: number; y: number } | null>(null);

  // History for undo/redo
  const [undoStack, setUndoStack] = useState<{ paths: DrawingPath[]; shapes: DrawingShape[] }[]>([]);
  const [redoStack, setRedoStack] = useState<{ paths: DrawingPath[]; shapes: DrawingShape[] }[]>([]);

  const pathRef = useRef<string>('');
  const svgRef = useRef<any>(null);

  // Save current state to undo stack
  const saveToUndoStack = useCallback(() => {
    setUndoStack(prev => [
      ...prev.slice(-19), // Keep last 20 states
      { paths: [...paths], shapes: [...shapes] }
    ]);
    setRedoStack([]); // Clear redo stack when new action is performed
  }, [paths, shapes]);

  // Create PanResponder for touch handling
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => !readOnly,
    onMoveShouldSetPanResponder: () => !readOnly,
    
    onPanResponderGrant: (event) => {
      if (readOnly) return;
      
      const { locationX, locationY } = event.nativeEvent;
      
      if (['line', 'rectangle', 'circle', 'arrow'].includes(currentTool)) {
        // Start shape drawing
        setShapeStartPoint({ x: locationX, y: locationY });
        setIsDrawing(true);
      } else {
        // Start path drawing
        saveToUndoStack();
        const startPath = `M${locationX.toFixed(2)},${locationY.toFixed(2)}`;
        pathRef.current = startPath;
        setCurrentPath(startPath);
        setIsDrawing(true);
      }
    },

    onPanResponderMove: (event) => {
      if (readOnly || !isDrawing) return;
      
      const { locationX, locationY } = event.nativeEvent;
      
      if (['line', 'rectangle', 'circle', 'arrow'].includes(currentTool) && shapeStartPoint) {
        // Update temporary shape
        const newTempShape: DrawingShape = {
          id: `temp_${Date.now()}`,
          type: currentTool as 'line' | 'rectangle' | 'circle' | 'arrow',
          startX: shapeStartPoint.x,
          startY: shapeStartPoint.y,
          endX: locationX,
          endY: locationY,
          stroke: currentColor,
          strokeWidth: DRAWING_TOOLS[currentTool].strokeWidth,
          timestamp: Date.now(),
        };
        setTempShape(newTempShape);
      } else {
        // Continue path drawing
        const newPoint = ` L${locationX.toFixed(2)},${locationY.toFixed(2)}`;
        pathRef.current += newPoint;
        setCurrentPath(pathRef.current);
      }
    },

    onPanResponderRelease: () => {
      if (readOnly || !isDrawing) return;
      
      if (['line', 'rectangle', 'circle', 'arrow'].includes(currentTool) && tempShape) {
        // Finalize shape
        const finalShape: DrawingShape = {
          ...tempShape,
          id: `shape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };
        
        const newShapes = [...shapes, finalShape];
        setShapes(newShapes);
        setTempShape(null);
        setShapeStartPoint(null);
        onDrawingChanged?.(paths, newShapes);
      } else if (pathRef.current) {
        // Finalize path
        const newPath: DrawingPath = {
          id: `path_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          d: pathRef.current,
          stroke: currentTool === 'eraser' ? backgroundColor : currentColor,
          strokeWidth: DRAWING_TOOLS[currentTool].strokeWidth,
          strokeOpacity: DRAWING_TOOLS[currentTool].opacity,
          tool: currentTool,
          timestamp: Date.now(),
        };
        
        const newPaths = [...paths, newPath];
        setPaths(newPaths);
        onDrawingChanged?.(newPaths, shapes);
        
        pathRef.current = '';
        setCurrentPath('');
      }
      
      setIsDrawing(false);
    },
  });

  // Undo last action
  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    
    const previousState = undoStack[undoStack.length - 1];
    const newUndoStack = undoStack.slice(0, -1);
    
    // Save current state to redo stack
    setRedoStack(prev => [...prev, { paths: [...paths], shapes: [...shapes] }]);
    setUndoStack(newUndoStack);
    
    setPaths(previousState.paths);
    setShapes(previousState.shapes);
    onDrawingChanged?.(previousState.paths, previousState.shapes);
  }, [undoStack, paths, shapes, onDrawingChanged]);

  // Redo last undone action
  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    
    const nextState = redoStack[redoStack.length - 1];
    const newRedoStack = redoStack.slice(0, -1);
    
    // Save current state to undo stack
    setUndoStack(prev => [...prev, { paths: [...paths], shapes: [...shapes] }]);
    setRedoStack(newRedoStack);
    
    setPaths(nextState.paths);
    setShapes(nextState.shapes);
    onDrawingChanged?.(nextState.paths, nextState.shapes);
  }, [redoStack, paths, shapes, onDrawingChanged]);

  // Clear canvas
  const handleClear = useCallback(() => {
    Alert.alert(
      'Clear Canvas',
      'Are you sure you want to clear all drawings? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: () => {
            saveToUndoStack();
            setPaths([]);
            setShapes([]);
            onDrawingChanged?.([], []);
          }
        }
      ]
    );
  }, [saveToUndoStack, onDrawingChanged]);

  // Export canvas as image (placeholder - would need native implementation)
  const handleExport = useCallback(() => {
    // This is a placeholder - actual implementation would need native SVG to base64 conversion
    Alert.alert('Export', 'Export functionality will be implemented with native module');
    // onExportImage?.('base64_string_here');
  }, []);

  const getStyles = (theme: any) => StyleSheet.create({
    container: {
      backgroundColor: theme.Surface,
      borderRadius: 12,
      padding: 16,
      marginVertical: 8,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },

    title: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.OnSurface,
    },

    headerControls: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },

    toolButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: theme.SurfaceVariant,
    },

    toolButtonActive: {
      backgroundColor: theme.primary,
    },

    toolIcon: {
      color: theme.OnSurfaceVariant,
    },

    toolIconActive: {
      color: theme.OnPrimary,
    },

    canvasContainer: {
      borderRadius: 8,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.Outline,
      backgroundColor: backgroundColor,
    },

    toolsPanel: {
      backgroundColor: theme.background,
      borderTopWidth: 1,
      borderTopColor: theme.OutlineVariant,
      paddingVertical: 12,
      paddingHorizontal: 16,
    },

    toolsSection: {
      marginBottom: 12,
    },

    toolsSectionTitle: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.OnSurfaceVariant,
      marginBottom: 8,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },

    toolsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },

    toolItem: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: theme.SurfaceVariant,
      minWidth: 40,
      alignItems: 'center',
    },

    toolItemActive: {
      backgroundColor: theme.primary,
    },

    toolItemText: {
      fontSize: 10,
      color: theme.OnSurfaceVariant,
      marginTop: 2,
      textAlign: 'center',
    },

    toolItemTextActive: {
      color: theme.OnPrimary,
    },

    colorPalette: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },

    colorButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 3,
      borderColor: 'transparent',
    },

    colorButtonActive: {
      borderColor: theme.primary,
    },

    actions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 8,
    },

    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.SurfaceVariant,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 8,
      gap: 4,
    },

    actionButtonDisabled: {
      opacity: 0.5,
    },

    clearButton: {
      backgroundColor: theme.errorContainer,
    },

    exportButton: {
      backgroundColor: theme.primaryContainer,
    },

    actionButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.OnSurfaceVariant,
    },

    clearButtonText: {
      color: theme.OnErrorContainer,
    },

    exportButtonText: {
      color: theme.OnPrimaryContainer,
    },

    readOnlyOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'transparent',
      alignItems: 'center',
      justifyContent: 'center',
    },

    readOnlyMessage: {
      backgroundColor: theme.SurfaceVariant + 'DD',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },

    readOnlyText: {
      fontSize: 12,
      color: theme.OnSurfaceVariant,
      fontWeight: '500',
    },
  });

  const styles = getStyles(theme);

  const renderGrid = () => {
    if (!showGrid) return null;
    
    const gridSize = 20;
    const lines = [];
    
    // Vertical lines
    for (let i = gridSize; i < width; i += gridSize) {
      lines.push(
        <Line
          key={`v-${i}`}
          x1={i}
          y1={0}
          x2={i}
          y2={height}
          stroke={theme.Outline}
          strokeWidth={0.5}
          opacity={0.3}
        />
      );
    }
    
    // Horizontal lines
    for (let i = gridSize; i < height; i += gridSize) {
      lines.push(
        <Line
          key={`h-${i}`}
          x1={0}
          y1={i}
          x2={width}
          y2={i}
          stroke={theme.Outline}
          strokeWidth={0.5}
          opacity={0.3}
        />
      );
    }
    
    return lines;
  };

  const renderShape = (shape: DrawingShape) => {
    const { startX, startY, endX, endY, stroke, strokeWidth } = shape;
    
    switch (shape.type) {
      case 'line':
        return (
          <Line
            key={shape.id}
            x1={startX}
            y1={startY}
            x2={endX}
            y2={endY}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
        );
        
      case 'rectangle':
        return (
          <Rect
            key={shape.id}
            x={Math.min(startX, endX)}
            y={Math.min(startY, endY)}
            width={Math.abs(endX - startX)}
            height={Math.abs(endY - startY)}
            stroke={stroke}
            strokeWidth={strokeWidth}
            fill={shape.fill || 'none'}
          />
        );
        
      case 'circle':
        const radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
        return (
          <Circle
            key={shape.id}
            cx={startX}
            cy={startY}
            r={radius}
            stroke={stroke}
            strokeWidth={strokeWidth}
            fill={shape.fill || 'none'}
          />
        );
        
      case 'arrow':
        // Simple arrow implementation
        const angle = Math.atan2(endY - startY, endX - startX);
        const arrowLength = 15;
        const arrowAngle = Math.PI / 6;
        
        const arrowX1 = endX - arrowLength * Math.cos(angle - arrowAngle);
        const arrowY1 = endY - arrowLength * Math.sin(angle - arrowAngle);
        const arrowX2 = endX - arrowLength * Math.cos(angle + arrowAngle);
        const arrowY2 = endY - arrowLength * Math.sin(angle + arrowAngle);
        
        return (
          <G key={shape.id}>
            <Line
              x1={startX}
              y1={startY}
              x2={endX}
              y2={endY}
              stroke={stroke}
              strokeWidth={strokeWidth}
            />
            <Line
              x1={endX}
              y1={endY}
              x2={arrowX1}
              y2={arrowY1}
              stroke={stroke}
              strokeWidth={strokeWidth}
            />
            <Line
              x1={endX}
              y1={endY}
              x2={arrowX2}
              y2={arrowY2}
              stroke={stroke}
              strokeWidth={strokeWidth}
            />
          </G>
        );
        
      default:
        return null;
    }
  };

  const TOOL_CONFIGS = [
    { tool: 'pen' as DrawingTool, icon: 'edit', label: 'Pen' },
    { tool: 'pencil' as DrawingTool, icon: 'create', label: 'Pencil' },
    { tool: 'marker' as DrawingTool, icon: 'brush', label: 'Marker' },
    { tool: 'highlighter' as DrawingTool, icon: 'format_paint', label: 'Highlight' },
    { tool: 'eraser' as DrawingTool, icon: 'auto_fix_normal', label: 'Eraser' },
    { tool: 'line' as DrawingTool, icon: 'horizontal_rule', label: 'Line' },
    { tool: 'rectangle' as DrawingTool, icon: 'crop_din', label: 'Rectangle' },
    { tool: 'circle' as DrawingTool, icon: 'radio_button_unchecked', label: 'Circle' },
    { tool: 'arrow' as DrawingTool, icon: 'arrow_forward', label: 'Arrow' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Drawing Canvas</Text>
        <View style={styles.headerControls}>
          <TouchableOpacity
            style={styles.toolButton}
            onPress={() => setShowTools(!showTools)}
            accessibilityLabel="Toggle tools"
          >
            <Icon name="palette" size={18} style={styles.toolIcon} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.canvasContainer}>
        <View {...panResponder.panHandlers}>
          <Svg
            ref={svgRef}
            width={width}
            height={height}
            style={{ backgroundColor }}
          >
            <Defs>
              {/* Grid pattern definition could go here */}
            </Defs>
            
            {/* Grid */}
            {renderGrid()}
            
            {/* Existing paths */}
            {paths.map((path) => (
              <Path
                key={path.id}
                d={path.d}
                stroke={path.stroke}
                strokeWidth={path.strokeWidth}
                strokeOpacity={path.strokeOpacity}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
            
            {/* Current path being drawn */}
            {currentPath && (
              <Path
                d={currentPath}
                stroke={currentTool === 'eraser' ? backgroundColor : currentColor}
                strokeWidth={DRAWING_TOOLS[currentTool].strokeWidth}
                strokeOpacity={DRAWING_TOOLS[currentTool].opacity}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            
            {/* Existing shapes */}
            {shapes.map(renderShape)}
            
            {/* Temporary shape being drawn */}
            {tempShape && renderShape(tempShape)}
          </Svg>
        </View>

        {readOnly && (
          <View style={styles.readOnlyOverlay}>
            <View style={styles.readOnlyMessage}>
              <Icon name="lock" size={16} color={theme.OnSurfaceVariant} />
              <Text style={styles.readOnlyText}>Read Only</Text>
            </View>
          </View>
        )}
      </View>

      {showTools && !readOnly && (
        <View style={styles.toolsPanel}>
          {/* Drawing Tools */}
          <View style={styles.toolsSection}>
            <Text style={styles.toolsSectionTitle}>Tools</Text>
            <View style={styles.toolsGrid}>
              {TOOL_CONFIGS.map(({ tool, icon, label }) => (
                <TouchableOpacity
                  key={tool}
                  style={[
                    styles.toolItem,
                    currentTool === tool && styles.toolItemActive,
                  ]}
                  onPress={() => setCurrentTool(tool)}
                  accessibilityLabel={`Select ${label}`}
                >
                  <Icon
                    name={icon}
                    size={16}
                    style={[
                      styles.toolIcon,
                      currentTool === tool && styles.toolIconActive,
                    ]}
                  />
                  <Text
                    style={[
                      styles.toolItemText,
                      currentTool === tool && styles.toolItemTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Colors */}
          <View style={styles.toolsSection}>
            <Text style={styles.toolsSectionTitle}>Colors</Text>
            <View style={styles.colorPalette}>
              {COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorButton,
                    { backgroundColor: color },
                    currentColor === color && styles.colorButtonActive,
                  ]}
                  onPress={() => setCurrentColor(color)}
                  accessibilityLabel={`Select color ${color}`}
                />
              ))}
            </View>
          </View>

          {/* Actions */}
          <View style={styles.toolsSection}>
            <Text style={styles.toolsSectionTitle}>Actions</Text>
            <View style={styles.actions}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  undoStack.length === 0 && styles.actionButtonDisabled,
                ]}
                onPress={handleUndo}
                disabled={undoStack.length === 0}
                accessibilityLabel="Undo"
              >
                <Icon name="undo" size={16} color={theme.OnSurfaceVariant} />
                <Text style={styles.actionButtonText}>Undo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  redoStack.length === 0 && styles.actionButtonDisabled,
                ]}
                onPress={handleRedo}
                disabled={redoStack.length === 0}
                accessibilityLabel="Redo"
              >
                <Icon name="redo" size={16} color={theme.OnSurfaceVariant} />
                <Text style={styles.actionButtonText}>Redo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.clearButton]}
                onPress={handleClear}
                accessibilityLabel="Clear canvas"
              >
                <Icon name="clear" size={16} color={theme.OnErrorContainer} />
                <Text style={[styles.actionButtonText, styles.clearButtonText]}>Clear</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.exportButton]}
                onPress={handleExport}
                accessibilityLabel="Export drawing"
              >
                <Icon name="download" size={16} color={theme.OnPrimaryContainer} />
                <Text style={[styles.actionButtonText, styles.exportButtonText]}>Export</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default DrawingCanvas;