/**
 * WhiteboardTools - Interactive toolbar for whiteboard controls
 * Phase 16: Annotation Tools
 * Provides tool selection, drawing options, text, shapes, and math annotations
 */

import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../context/ThemeContext';
import { DrawingTool, BackgroundType } from './WhiteboardCanvas';

interface WhiteboardToolsProps {
  selectedTool: DrawingTool;
  onToolChange: (tool: DrawingTool) => void;
  currentColor: string;
  onColorChange: (color: string) => void;
  strokeWidth: number;
  onStrokeWidthChange: (width: number) => void;
  backgroundColor: BackgroundType;
  onBackgroundChange: (background: BackgroundType) => void;
  onClear: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isTeacherView?: boolean;
  // Phase 16: Annotation Tools
  selectedShapeType?: 'rectangle' | 'circle' | 'line' | 'arrow' | 'triangle' | 'ellipse';
  onShapeTypeChange?: (shape: 'rectangle' | 'circle' | 'line' | 'arrow' | 'triangle' | 'ellipse') => void;
  onTextToolClick?: () => void;
  onMathToolClick?: () => void;
  onShapeToolClick?: () => void;
}

const TOOL_CONFIG = {
  pen: { icon: 'edit', label: 'Pen' },
  marker: { icon: 'brush', label: 'Marker' },
  highlighter: { icon: 'format_paint', label: 'Highlighter' },
  eraser: { icon: 'auto_fix_normal', label: 'Eraser' },
  text: { icon: 'text_fields', label: 'Text' },
  shape: { icon: 'crop_din', label: 'Shape' },
};

const COLOR_PALETTE = [
  '#000000', // Black
  '#FF0000', // Red
  '#0000FF', // Blue
  '#00FF00', // Green
  '#FFFF00', // Yellow
  '#FF8000', // Orange
  '#800080', // Purple
  '#FFC0CB', // Pink
];

const STROKE_WIDTHS = [2, 4, 6, 8, 12];

const BACKGROUND_TYPES: { type: BackgroundType; icon: string; label: string }[] = [
  { type: 'blank', icon: 'crop_din', label: 'Blank' },
  { type: 'grid', icon: 'grid_on', label: 'Grid' },
  { type: 'lines', icon: 'view_headline', label: 'Lines' },
  { type: 'dots', icon: 'fiber_manual_record', label: 'Dots' },
];

const WhiteboardTools: React.FC<WhiteboardToolsProps> = ({
  selectedTool,
  onToolChange,
  currentColor,
  onColorChange,
  strokeWidth,
  onStrokeWidthChange,
  backgroundColor,
  onBackgroundChange,
  onClear,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  isTeacherView = false,
  selectedShapeType = 'rectangle',
  onShapeTypeChange,
  onTextToolClick,
  onMathToolClick,
  onShapeToolClick,
}) => {
  const { theme } = useTheme();

  const getStyles = (theme: any) => StyleSheet.create({
    container: {
      backgroundColor: theme.Surface,
      borderRadius: 12,
      padding: 12,
      marginBottom: 16,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    
    section: {
      marginBottom: 12,
    },
    
    sectionTitle: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.OnSurfaceVariant,
      marginBottom: 8,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    
    toolsRow: {
      flexDirection: 'row',
      gap: 8,
    },
    
    toolButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.SurfaceVariant,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    
    toolButtonActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    
    toolIcon: {
      color: theme.OnSurfaceVariant,
    },
    
    toolIconActive: {
      color: theme.OnPrimary,
    },
    
    colorsRow: {
      flexDirection: 'row',
      gap: 8,
      flexWrap: 'wrap',
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
      borderWidth: 3,
    },
    
    strokeRow: {
      flexDirection: 'row',
      gap: 8,
    },
    
    strokeButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.SurfaceVariant,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    
    strokeButtonActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    
    strokeIndicator: {
      backgroundColor: theme.OnSurfaceVariant,
      borderRadius: 10,
    },
    
    strokeIndicatorActive: {
      backgroundColor: theme.OnPrimary,
    },
    
    backgroundRow: {
      flexDirection: 'row',
      gap: 8,
    },
    
    backgroundButton: {
      width: 44,
      height: 44,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.SurfaceVariant,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    
    backgroundButtonActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    
    backgroundIcon: {
      color: theme.OnSurfaceVariant,
    },
    
    backgroundIconActive: {
      color: theme.OnPrimary,
    },
    
    actionsRow: {
      flexDirection: 'row',
      gap: 8,
    },
    
    actionButton: {
      flex: 1,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.SurfaceVariant,
      flexDirection: 'row',
      gap: 4,
    },
    
    actionButtonDisabled: {
      opacity: 0.5,
    },
    
    clearButton: {
      backgroundColor: theme.error,
    },
    
    actionIcon: {
      color: theme.OnSurfaceVariant,
    },
    
    actionIconClear: {
      color: theme.OnError,
    },
    
    actionText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.OnSurfaceVariant,
    },
    
    actionTextClear: {
      color: theme.OnError,
    },
    
    disabledMessage: {
      textAlign: 'center',
      color: theme.OnSurfaceVariant,
      fontSize: 14,
      fontStyle: 'italic',
      padding: 16,
    },
    
    annotationButton: {
      backgroundColor: theme.TertiaryContainer,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 6,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginRight: 8,
    },
    
    annotationButtonText: {
      fontSize: 12,
      fontWeight: '500',
      color: theme.OnTertiaryContainer,
    },
  });

  const styles = getStyles(theme);

  if (!isTeacherView) {
    return (
      <View style={styles.container}>
        <Text style={styles.disabledMessage}>
          Whiteboard tools are only available for teachers
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Drawing Tools */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tools</Text>
        <View style={styles.toolsRow}>
          {(Object.keys(TOOL_CONFIG) as DrawingTool[]).map((tool) => {
            const config = TOOL_CONFIG[tool];
            const isActive = selectedTool === tool;
            
            return (
              <TouchableOpacity
                key={tool}
                style={[
                  styles.toolButton,
                  isActive && styles.toolButtonActive,
                ]}
                onPress={() => onToolChange(tool)}
                accessibilityLabel={`Select ${config.label} tool`}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
              >
                <Icon
                  name={config.icon}
                  size={20}
                  style={[
                    styles.toolIcon,
                    isActive && styles.toolIconActive,
                  ]}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Phase 16: Annotation Tools */}
      {(selectedTool === 'text' || selectedTool === 'shape') && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Annotation Tools</Text>
          <View style={styles.toolsRow}>
            {selectedTool === 'text' && (
              <>
                <TouchableOpacity
                  style={styles.annotationButton}
                  onPress={onTextToolClick}
                  accessibilityLabel="Add text annotation"
                >
                  <Icon name="text_fields" size={20} style={styles.toolIcon} />
                  <Text style={styles.annotationButtonText}>Text</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.annotationButton}
                  onPress={onMathToolClick}
                  accessibilityLabel="Add math notation"
                >
                  <Icon name="functions" size={20} style={styles.toolIcon} />
                  <Text style={styles.annotationButtonText}>Math</Text>
                </TouchableOpacity>
              </>
            )}
            
            {selectedTool === 'shape' && (
              <TouchableOpacity
                style={styles.annotationButton}
                onPress={onShapeToolClick}
                accessibilityLabel="Select shape type"
              >
                <Icon name="crop_din" size={20} style={styles.toolIcon} />
                <Text style={styles.annotationButtonText}>
                  {selectedShapeType?.charAt(0).toUpperCase() + selectedShapeType?.slice(1)}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Color Palette */}
      {selectedTool !== 'eraser' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Colors</Text>
          <View style={styles.colorsRow}>
            {COLOR_PALETTE.map((color) => {
              const isActive = currentColor === color;
              
              return (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorButton,
                    { backgroundColor: color },
                    isActive && styles.colorButtonActive,
                  ]}
                  onPress={() => onColorChange(color)}
                  accessibilityLabel={`Select color ${color}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                />
              );
            })}
          </View>
        </View>
      )}

      {/* Stroke Width */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Size</Text>
        <View style={styles.strokeRow}>
          {STROKE_WIDTHS.map((width) => {
            const isActive = strokeWidth === width;
            
            return (
              <TouchableOpacity
                key={width}
                style={[
                  styles.strokeButton,
                  isActive && styles.strokeButtonActive,
                ]}
                onPress={() => onStrokeWidthChange(width)}
                accessibilityLabel={`Select stroke width ${width}`}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
              >
                <View
                  style={[
                    styles.strokeIndicator,
                    {
                      width: Math.min(width * 2, 20),
                      height: Math.min(width * 2, 20),
                    },
                    isActive && styles.strokeIndicatorActive,
                  ]}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Background Options */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Background</Text>
        <View style={styles.backgroundRow}>
          {BACKGROUND_TYPES.map(({ type, icon, label }) => {
            const isActive = backgroundColor === type;
            
            return (
              <TouchableOpacity
                key={type}
                style={[
                  styles.backgroundButton,
                  isActive && styles.backgroundButtonActive,
                ]}
                onPress={() => onBackgroundChange(type)}
                accessibilityLabel={`Select ${label} background`}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
              >
                <Icon
                  name={icon}
                  size={20}
                  style={[
                    styles.backgroundIcon,
                    isActive && styles.backgroundIconActive,
                  ]}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              !canUndo && styles.actionButtonDisabled,
            ]}
            onPress={onUndo}
            disabled={!canUndo}
            accessibilityLabel="Undo last action"
            accessibilityRole="button"
            accessibilityState={{ disabled: !canUndo }}
          >
            <Icon
              name="undo"
              size={16}
              style={styles.actionIcon}
            />
            <Text style={styles.actionText}>Undo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              !canRedo && styles.actionButtonDisabled,
            ]}
            onPress={onRedo}
            disabled={!canRedo}
            accessibilityLabel="Redo last action"
            accessibilityRole="button"
            accessibilityState={{ disabled: !canRedo }}
          >
            <Icon
              name="redo"
              size={16}
              style={styles.actionIcon}
            />
            <Text style={styles.actionText}>Redo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.clearButton]}
            onPress={onClear}
            accessibilityLabel="Clear whiteboard"
            accessibilityRole="button"
          >
            <Icon
              name="clear"
              size={16}
              style={styles.actionIconClear}
            />
            <Text style={styles.actionTextClear}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default WhiteboardTools;