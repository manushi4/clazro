/**
 * ShapeTools - Shape selection and drawing tools component
 * Phase 16: Annotation Tools
 * Provides geometric shape tools for whiteboard annotations
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Svg, { Rect, Circle, Line, Path, Defs, Marker } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';

export type ShapeType = 'rectangle' | 'circle' | 'line' | 'arrow' | 'triangle' | 'ellipse';

interface ShapeToolsProps {
  visible: boolean;
  onClose: () => void;
  onShapeSelect: (shape: ShapeType) => void;
  selectedShape?: ShapeType;
}

const SHAPE_CONFIGS = {
  rectangle: {
    icon: 'crop_din',
    label: 'Rectangle',
    description: 'Draw rectangles and squares',
  },
  circle: {
    icon: 'radio_button_unchecked',
    label: 'Circle',
    description: 'Draw circles and ovals',
  },
  line: {
    icon: 'remove',
    label: 'Line',
    description: 'Draw straight lines',
  },
  arrow: {
    icon: 'arrow_forward',
    label: 'Arrow',
    description: 'Draw arrows and pointers',
  },
  triangle: {
    icon: 'change_history',
    label: 'Triangle',
    description: 'Draw triangular shapes',
  },
  ellipse: {
    icon: 'panorama_fish_eye',
    label: 'Ellipse',
    description: 'Draw oval and elliptical shapes',
  },
};

const ShapeTools: React.FC<ShapeToolsProps> = ({
  visible,
  onClose,
  onShapeSelect,
  selectedShape,
}) => {
  const { theme } = useTheme();

  const getStyles = (theme: any) => StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    
    container: {
      backgroundColor: theme.Surface,
      borderRadius: 12,
      padding: 20,
      width: '90%',
      maxWidth: 400,
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
    },
    
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.Outline,
    },
    
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.OnSurface,
    },
    
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.SurfaceVariant,
      alignItems: 'center',
      justifyContent: 'center',
    },
    
    shapesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      justifyContent: 'space-between',
    },
    
    shapeButton: {
      width: '45%',
      aspectRatio: 1,
      backgroundColor: theme.SurfaceVariant,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
      padding: 16,
    },
    
    shapeButtonActive: {
      backgroundColor: theme.primaryContainer,
      borderColor: theme.primary,
    },
    
    shapeContent: {
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
    },
    
    shapePreview: {
      marginBottom: 8,
    },
    
    shapeIcon: {
      color: theme.OnSurfaceVariant,
      marginBottom: 8,
    },
    
    shapeIconActive: {
      color: theme.OnPrimaryContainer,
    },
    
    shapeLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.OnSurfaceVariant,
      textAlign: 'center',
    },
    
    shapeLabelActive: {
      color: theme.OnPrimaryContainer,
    },
    
    shapeDescription: {
      fontSize: 11,
      color: theme.OnSurfaceVariant,
      textAlign: 'center',
      marginTop: 4,
      opacity: 0.8,
    },
    
    shapeDescriptionActive: {
      color: theme.OnPrimaryContainer,
    },
    
    instructionsSection: {
      marginTop: 20,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: theme.Outline,
    },
    
    instructionsTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.OnSurface,
      marginBottom: 8,
    },
    
    instructionText: {
      fontSize: 12,
      color: theme.OnSurfaceVariant,
      lineHeight: 16,
      textAlign: 'center',
    },
  });

  const styles = getStyles(theme);

  const handleShapeSelect = (shape: ShapeType) => {
    onShapeSelect(shape);
    onClose();
  };

  const renderShapePreview = (shape: ShapeType, isActive: boolean) => {
    const color = isActive ? theme.OnPrimaryContainer : theme.OnSurfaceVariant;
    const size = 32;
    
    switch (shape) {
      case 'rectangle':
        return (
          <Svg width={size} height={size} viewBox="0 0 32 32">
            <Rect
              x={4}
              y={8}
              width={24}
              height={16}
              fill="none"
              stroke={color}
              strokeWidth={2}
            />
          </Svg>
        );
        
      case 'circle':
        return (
          <Svg width={size} height={size} viewBox="0 0 32 32">
            <Circle
              cx={16}
              cy={16}
              r={12}
              fill="none"
              stroke={color}
              strokeWidth={2}
            />
          </Svg>
        );
        
      case 'line':
        return (
          <Svg width={size} height={size} viewBox="0 0 32 32">
            <Line
              x1={4}
              y1={28}
              x2={28}
              y2={4}
              stroke={color}
              strokeWidth={2}
            />
          </Svg>
        );
        
      case 'arrow':
        return (
          <Svg width={size} height={size} viewBox="0 0 32 32">
            <Defs>
              <Marker
                id="arrowhead"
                markerWidth={10}
                markerHeight={7}
                refX={9}
                refY={3.5}
                orient="auto"
              >
                <Path d="M0,0 L0,7 L10,3.5 z" fill={color} />
              </Marker>
            </Defs>
            <Line
              x1={4}
              y1={16}
              x2={24}
              y2={16}
              stroke={color}
              strokeWidth={2}
              markerEnd="url(#arrowhead)"
            />
          </Svg>
        );
        
      case 'triangle':
        return (
          <Svg width={size} height={size} viewBox="0 0 32 32">
            <Path
              d="M16,4 L28,26 L4,26 Z"
              fill="none"
              stroke={color}
              strokeWidth={2}
            />
          </Svg>
        );
        
      case 'ellipse':
        return (
          <Svg width={size} height={size} viewBox="0 0 32 32">
            <Circle
              cx={16}
              cy={16}
              rx={14}
              ry={10}
              fill="none"
              stroke={color}
              strokeWidth={2}
            />
          </Svg>
        );
        
      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="scale"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>🔺 Shape Tools</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              accessibilityLabel="Close shape tools"
            >
              <Icon name="close" size={20} color={theme.OnSurfaceVariant} />
            </TouchableOpacity>
          </View>

          {/* Shapes Grid */}
          <View style={styles.shapesGrid}>
            {(Object.keys(SHAPE_CONFIGS) as ShapeType[]).map((shape) => {
              const config = SHAPE_CONFIGS[shape];
              const isActive = selectedShape === shape;
              
              return (
                <TouchableOpacity
                  key={shape}
                  style={[
                    styles.shapeButton,
                    isActive && styles.shapeButtonActive,
                  ]}
                  onPress={() => handleShapeSelect(shape)}
                  accessibilityLabel={`Select ${config.label} tool`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                >
                  <View style={styles.shapeContent}>
                    <View style={styles.shapePreview}>
                      {renderShapePreview(shape, isActive)}
                    </View>
                    <Text
                      style={[
                        styles.shapeLabel,
                        isActive && styles.shapeLabelActive,
                      ]}
                    >
                      {config.label}
                    </Text>
                    <Text
                      style={[
                        styles.shapeDescription,
                        isActive && styles.shapeDescriptionActive,
                      ]}
                    >
                      {config.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Instructions */}
          <View style={styles.instructionsSection}>
            <Text style={styles.instructionsTitle}>How to Use:</Text>
            <Text style={styles.instructionText}>
              1. Select a shape from above{'\n'}
              2. Tap and drag on the whiteboard to draw{'\n'}
              3. Hold and drag corners to resize{'\n'}
              4. Tap to move or delete shapes
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ShapeTools;