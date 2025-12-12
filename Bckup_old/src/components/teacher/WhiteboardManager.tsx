/**
 * WhiteboardManager - Main whiteboard component with integrated tools and canvas
 * Phase 16: Annotation Tools
 * Combines WhiteboardCanvas and WhiteboardTools with text, shapes, and math annotation support
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { WhiteboardCanvas, DrawingPath, DrawingTool, BackgroundType, TextAnnotation, ShapeAnnotation } from './WhiteboardCanvas';
import { WhiteboardTools } from './WhiteboardTools';
import { MathNotationInput } from './MathNotationInput';
import { ShapeTools } from './ShapeTools';

interface WhiteboardManagerProps {
  isTeacherView?: boolean;
  onPathsChanged?: (paths: DrawingPath[]) => void;
  initialPaths?: DrawingPath[];
  width?: number;
  height?: number;
}

const WhiteboardManager: React.FC<WhiteboardManagerProps> = ({
  isTeacherView = false,
  onPathsChanged,
  initialPaths = [],
  width,
  height,
}) => {
  const { theme } = useTheme();
  
  // Drawing state
  const [paths, setPaths] = useState<DrawingPath[]>(initialPaths);
  const [textAnnotations, setTextAnnotations] = useState<TextAnnotation[]>([]);
  const [shapeAnnotations, setShapeAnnotations] = useState<ShapeAnnotation[]>([]);
  const [undoStack, setUndoStack] = useState<DrawingPath[][]>([]);
  const [redoStack, setRedoStack] = useState<DrawingPath[][]>([]);
  
  // Tool state
  const [selectedTool, setSelectedTool] = useState<DrawingTool>('pen');
  const [currentColor, setCurrentColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [backgroundColor, setBackgroundColor] = useState<BackgroundType>('blank');
  const [selectedShapeType, setSelectedShapeType] = useState<'rectangle' | 'circle' | 'line' | 'arrow' | 'triangle' | 'ellipse'>('rectangle');
  
  // Modal states for Phase 16
  const [showMathNotation, setShowMathNotation] = useState(false);
  const [showShapeTools, setShowShapeTools] = useState(false);
  const [textInputPosition, setTextInputPosition] = useState({ x: 0, y: 0 });

  const saveState = useCallback((newPaths: DrawingPath[]) => {
    setUndoStack(prev => [...prev, paths]);
    setRedoStack([]); // Clear redo stack when new action is performed
    setPaths(newPaths);
    onPathsChanged?.(newPaths);
  }, [paths, onPathsChanged]);

  const handlePathAdded = useCallback((newPath: DrawingPath) => {
    const newPaths = [...paths, newPath];
    saveState(newPaths);
  }, [paths, saveState]);

  const handlePathsChanged = useCallback((newPaths: DrawingPath[]) => {
    setPaths(newPaths);
    onPathsChanged?.(newPaths);
  }, [onPathsChanged]);

  const handleUndo = useCallback(() => {
    if (undoStack.length > 0) {
      const previousState = undoStack[undoStack.length - 1];
      const newUndoStack = undoStack.slice(0, -1);
      
      setRedoStack(prev => [...prev, paths]);
      setUndoStack(newUndoStack);
      setPaths(previousState);
      onPathsChanged?.(previousState);
    }
  }, [undoStack, paths, onPathsChanged]);

  const handleRedo = useCallback(() => {
    if (redoStack.length > 0) {
      const nextState = redoStack[redoStack.length - 1];
      const newRedoStack = redoStack.slice(0, -1);
      
      setUndoStack(prev => [...prev, paths]);
      setRedoStack(newRedoStack);
      setPaths(nextState);
      onPathsChanged?.(nextState);
    }
  }, [redoStack, paths, onPathsChanged]);

  const handleClear = useCallback(() => {
    if (paths.length > 0) {
      saveState([]);
    }
  }, [paths, saveState]);

  const handleToolChange = useCallback((tool: DrawingTool) => {
    setSelectedTool(tool);
    
    // Auto-adjust color for eraser (will be handled by canvas)
    if (tool === 'eraser') {
      // Eraser color is handled by the canvas component
    }
  }, []);

  const handleColorChange = useCallback((color: string) => {
    setCurrentColor(color);
  }, []);

  const handleStrokeWidthChange = useCallback((width: number) => {
    setStrokeWidth(width);
  }, []);

  const handleBackgroundChange = useCallback((background: BackgroundType) => {
    setBackgroundColor(background);
  }, []);

  // Phase 16: Annotation handlers
  const handleTextAdded = useCallback((annotation: TextAnnotation) => {
    const updatedTextAnnotations = [...textAnnotations, annotation];
    setTextAnnotations(updatedTextAnnotations);
    console.log('Text annotation added:', annotation);
  }, [textAnnotations]);

  const handleShapeAdded = useCallback((annotation: ShapeAnnotation) => {
    const updatedShapeAnnotations = [...shapeAnnotations, annotation];
    setShapeAnnotations(updatedShapeAnnotations);
    console.log('Shape annotation added:', annotation);
  }, [shapeAnnotations]);

  const handleMathInserted = useCallback((latex: string) => {
    const mathAnnotation: TextAnnotation = {
      id: `math_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      x: textInputPosition.x,
      y: textInputPosition.y,
      text: latex,
      fontSize: 16,
      color: currentColor,
      isMath: true,
      latex: latex,
      timestamp: Date.now(),
    };
    handleTextAdded(mathAnnotation);
    setShowMathNotation(false);
  }, [textInputPosition, currentColor, handleTextAdded]);

  const handleTextToolClick = useCallback(() => {
    console.log('Text tool clicked - position input needed');
    // This will be handled by canvas tap for positioning
  }, []);

  const handleMathToolClick = useCallback(() => {
    setShowMathNotation(true);
  }, []);

  const handleShapeToolClick = useCallback(() => {
    setShowShapeTools(true);
  }, []);

  const handleShapeTypeChange = useCallback((shape: 'rectangle' | 'circle' | 'line' | 'arrow' | 'triangle' | 'ellipse') => {
    setSelectedShapeType(shape);
    setShowShapeTools(false);
  }, []);

  const getStyles = (theme: any) => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    
    scrollContainer: {
      flex: 1,
    },
    
    contentContainer: {
      padding: 16,
    },
    
    toolsContainer: {
      marginBottom: 16,
    },
    
    canvasContainer: {
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

  const styles = getStyles(theme);

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Whiteboard Tools */}
        <View style={styles.toolsContainer}>
          <WhiteboardTools
            selectedTool={selectedTool}
            onToolChange={handleToolChange}
            currentColor={currentColor}
            onColorChange={handleColorChange}
            strokeWidth={strokeWidth}
            onStrokeWidthChange={handleStrokeWidthChange}
            backgroundColor={backgroundColor}
            onBackgroundChange={handleBackgroundChange}
            onClear={handleClear}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={undoStack.length > 0}
            canRedo={redoStack.length > 0}
            isTeacherView={isTeacherView}
            // Phase 16: Annotation Tools
            selectedShapeType={selectedShapeType}
            onShapeTypeChange={handleShapeTypeChange}
            onTextToolClick={handleTextToolClick}
            onMathToolClick={handleMathToolClick}
            onShapeToolClick={handleShapeToolClick}
          />
        </View>

        {/* Whiteboard Canvas */}
        <View style={styles.canvasContainer}>
          <WhiteboardCanvas
            isTeacherView={isTeacherView}
            canDraw={isTeacherView}
            currentTool={selectedTool}
            currentColor={currentColor}
            strokeWidth={strokeWidth}
            backgroundColor={backgroundColor}
            onPathAdded={handlePathAdded}
            onPathsChanged={handlePathsChanged}
            paths={paths}
            // Phase 16: Annotation Tools
            textAnnotations={textAnnotations}
            shapeAnnotations={shapeAnnotations}
            onTextAdded={handleTextAdded}
            onShapeAdded={handleShapeAdded}
            onTextAnnotationsChanged={setTextAnnotations}
            onShapeAnnotationsChanged={setShapeAnnotations}
            selectedShapeType={selectedShapeType}
            width={width}
            height={height}
            showGrid={backgroundColor === 'grid'}
          />
        </View>

        {/* Phase 16: Annotation Modals */}
        <MathNotationInput
          visible={showMathNotation}
          onClose={() => setShowMathNotation(false)}
          onInsertMath={handleMathInserted}
          position={textInputPosition}
        />

        <ShapeTools
          visible={showShapeTools}
          onClose={() => setShowShapeTools(false)}
          onShapeSelect={handleShapeTypeChange}
          selectedShape={selectedShapeType}
        />
      </ScrollView>
    </View>
  );
};

export default WhiteboardManager;