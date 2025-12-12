/**
 * Input Component Library - Coaching Management Platform
 * Complete Form Input Components with Material Design 3
 * 
 * Based on coaching research design specifications
 * Implements TextField, SearchField, SelectField, and specialized inputs
 */

import React, {useState, useRef} from 'react';
import {
  TextInput,
  View,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
  Modal,
  FlatList,
  Animated,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useTheme} from '../../context/ThemeContext';
import {BodyText, LabelText} from './Typography';
import {IconButton} from './Button';

const {width} = Dimensions.get('window');

// Design tokens from coaching research
const SPACING = {
  XS: 4,
  SM: 8,
  MD: 16,
  LG: 24,
};

const BORDER_RADIUS = {
  SM: 8,
  MD: 12,
  LG: 16,
};

// Semantic colors from coaching research
const SEMANTIC_COLORS = {
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
};

// Base Input Props
interface BaseInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  required?: boolean;
  style?: ViewStyle;
  testID?: string;
}

// TextField Props
interface TextFieldProps extends BaseInputProps {
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'url';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  secureTextEntry?: boolean;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
}

// TextField Component
const TextField: React.FC<TextFieldProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  disabled = false,
  error,
  helperText,
  required = false,
  multiline = false,
  numberOfLines = 1,
  maxLength,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  secureTextEntry = false,
  leftIcon,
  rightIcon,
  onRightIconPress,
  style,
  testID,
}) => {
  const {theme} = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const animatedIsFocused = useRef(new Animated.Value(value ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.timing(animatedIsFocused, {
      toValue: isFocused || value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value]);

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  const getBorderColor = () => {
    if (error) return SEMANTIC_COLORS.error;
    if (isFocused) return theme.primary;
    return theme.Outline;
  };

  const getLabelColor = () => {
    if (error) return SEMANTIC_COLORS.error;
    if (isFocused) return theme.primary;
    return theme.OnSurfaceVariant;
  };

  const labelStyle = {
    position: 'absolute' as const,
    left: leftIcon ? 48 : SPACING.md,
    top: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: [20, -8],
    }),
    fontSize: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: getLabelColor(),
    backgroundColor: theme.Surface,
    paddingHorizontal: SPACING.xs,
    zIndex: 1,
  };

  return (
    <View style={[styles.inputContainer, style]}>
      <View style={styles.inputWrapper}>
        <Animated.Text style={labelStyle}>
          {label}{required && ' *'}
        </Animated.Text>
        
        <View
          style={[
            styles.textInputContainer,
            {
              borderColor: getBorderColor(),
              backgroundColor: theme.Surface,
            },
            multiline && {minHeight: numberOfLines * 24 + 32},
          ]}>
          
          {leftIcon && (
            <Icon
              name={leftIcon}
              size={24}
              color={theme.OnSurfaceVariant}
              style={styles.leftIcon}
            />
          )}
          
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={isFocused ? placeholder : ''}
            placeholderTextColor={theme.OnSurfaceVariant}
            editable={!disabled}
            multiline={multiline}
            numberOfLines={numberOfLines}
            maxLength={maxLength}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            secureTextEntry={secureTextEntry}
            onFocus={handleFocus}
            onBlur={handleBlur}
            style={[
              styles.textInput,
              {
                color: theme.OnSurface,
                paddingLeft: leftIcon ? 48 : SPACING.md,
                paddingRight: rightIcon ? 48 : SPACING.md,
              },
              disabled && {color: theme.OnSurface + '60'},
              multiline && {textAlignVertical: 'top'},
            ]}
            testID={testID}
          />
          
          {rightIcon && (
            <TouchableOpacity
              style={styles.rightIcon}
              onPress={onRightIconPress}
              disabled={!onRightIconPress}>
              <Icon
                name={rightIcon}
                size={24}
                color={theme.OnSurfaceVariant}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {(error || helperText) && (
        <View style={styles.helperContainer}>
          {error && (
            <View style={styles.errorContainer}>
              <Icon name="error" size={16} color={SEMANTIC_COLORS.error} />
              <BodyText 
                size="small" 
                color={SEMANTIC_COLORS.error} 
                style={styles.helperText}>
                {error}
              </BodyText>
            </View>
          )}
          {!error && helperText && (
            <BodyText 
              size="small" 
              color={theme.OnSurfaceVariant} 
              style={styles.helperText}>
              {helperText}
            </BodyText>
          )}
        </View>
      )}
      
      {maxLength && (
        <View style={styles.counterContainer}>
          <BodyText 
            size="small" 
            color={theme.OnSurfaceVariant}
            style={styles.counterText}>
            {value.length}/{maxLength}
          </BodyText>
        </View>
      )}
    </View>
  );
};

// Search Field Component
interface SearchFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  disabled?: boolean;
  style?: ViewStyle;
  testID?: string;
}

const SearchField: React.FC<SearchFieldProps> = ({
  value,
  onChangeText,
  onSubmit,
  placeholder = 'Search...',
  disabled = false,
  style,
  testID,
}) => {
  const {theme} = useTheme();

  return (
    <View style={[styles.searchContainer, style]}>
      <View
        style={[
          styles.searchInputContainer,
          {
            backgroundColor: theme.SurfaceVariant,
            borderColor: theme.Outline + '40',
          },
        ]}>
        
        <Icon
          name="search"
          size={24}
          color={theme.OnSurfaceVariant}
          style={styles.searchIcon}
        />
        
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.OnSurfaceVariant}
          editable={!disabled}
          onSubmitEditing={onSubmit}
          returnKeyType="search"
          style={[
            styles.searchInput,
            {color: theme.OnSurface},
          ]}
          testID={testID}
        />
        
        {value.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => onChangeText('')}>
            <Icon
              name="clear"
              size={20}
              color={theme.OnSurfaceVariant}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// Select Field Props
interface SelectOption {
  label: string;
  value: string;
  icon?: string;
}

interface SelectFieldProps extends Omit<BaseInputProps, 'onChangeText'> {
  options: SelectOption[];
  onSelect: (option: SelectOption) => void;
  selectedValue?: string;
  searchable?: boolean;
}

// Select Field Component
const SelectField: React.FC<SelectFieldProps> = ({
  label,
  value,
  options,
  onSelect,
  selectedValue,
  placeholder,
  disabled = false,
  error,
  helperText,
  required = false,
  searchable = false,
  style,
  testID,
}) => {
  const {theme} = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOptions = searchable
    ? options.filter(option =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  const selectedOption = options.find(option => option.value === selectedValue);

  const handleSelect = (option: SelectOption) => {
    onSelect(option);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.selectContainer, style]}
        onPress={() => !disabled && setIsOpen(true)}
        disabled={disabled}
        testID={testID}>
        
        <View
          style={[
            styles.selectInputContainer,
            {
              borderColor: error 
                ? SEMANTIC_COLORS.error 
                : theme.Outline,
              backgroundColor: theme.Surface,
            },
          ]}>
          
          <View style={styles.selectContent}>
            <LabelText 
              size="small" 
              color={theme.OnSurfaceVariant}
              style={styles.selectLabel}>
              {label}{required && ' *'}
            </LabelText>
            
            <BodyText 
              color={selectedOption ? theme.OnSurface : theme.OnSurfaceVariant}
              style={styles.selectValue}>
              {selectedOption?.label || placeholder || 'Select an option'}
            </BodyText>
          </View>
          
          <Icon
            name={isOpen ? 'expand-less' : 'expand-more'}
            size={24}
            color={theme.OnSurfaceVariant}
            style={styles.selectIcon}
          />
        </View>
      </TouchableOpacity>

      {(error || helperText) && (
        <View style={styles.helperContainer}>
          {error && (
            <View style={styles.errorContainer}>
              <Icon name="error" size={16} color={SEMANTIC_COLORS.error} />
              <BodyText 
                size="small" 
                color={SEMANTIC_COLORS.error} 
                style={styles.helperText}>
                {error}
              </BodyText>
            </View>
          )}
          {!error && helperText && (
            <BodyText 
              size="small" 
              color={theme.OnSurfaceVariant} 
              style={styles.helperText}>
              {helperText}
            </BodyText>
          )}
        </View>
      )}

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}>
        
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}>
          
          <View style={[styles.optionsContainer, {backgroundColor: theme.Surface}]}>
            {searchable && (
              <SearchField
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder={`Search ${label.toLowerCase()}`}
                style={styles.searchInModal}
              />
            )}
            
            <FlatList
              data={filteredOptions}
              keyExtractor={item => item.value}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={[
                    styles.optionItem,
                    item.value === selectedValue && {
                      backgroundColor: theme.primary + '10',
                    },
                  ]}
                  onPress={() => handleSelect(item)}>
                  
                  {item.icon && (
                    <Icon
                      name={item.icon}
                      size={24}
                      color={theme.OnSurface}
                      style={styles.optionIcon}
                    />
                  )}
                  
                  <BodyText 
                    color={theme.OnSurface}
                    style={styles.optionText}>
                    {item.label}
                  </BodyText>
                  
                  {item.value === selectedValue && (
                    <Icon
                      name="check"
                      size={24}
                      color={theme.primary}
                      style={styles.checkIcon}
                    />
                  )}
                </TouchableOpacity>
              )}
              style={styles.optionsList}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

// Password Field Component
const PasswordField: React.FC<Omit<TextFieldProps, 'secureTextEntry' | 'rightIcon' | 'onRightIconPress'>> = (props) => {
  const [isSecure, setIsSecure] = useState(true);

  return (
    <TextField
      {...props}
      secureTextEntry={isSecure}
      rightIcon={isSecure ? 'visibility' : 'visibility-off'}
      onRightIconPress={() => setIsSecure(!isSecure)}
      keyboardType="default"
    />
  );
};

// Styles
const styles = StyleSheet.create({
  inputContainer: {
    marginBottom: SPACING.sm,
  },
  
  inputWrapper: {
    position: 'relative',
  },
  
  textInputContainer: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingVertical: SPACING.sm,
  },
  
  textInput: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  
  leftIcon: {
    position: 'absolute',
    left: SPACING.md,
    zIndex: 1,
  },
  
  rightIcon: {
    position: 'absolute',
    right: SPACING.md,
    zIndex: 1,
    padding: SPACING.xs,
  },
  
  helperContainer: {
    marginTop: SPACING.xs,
    marginHorizontal: SPACING.md,
  },
  
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  helperText: {
    marginLeft: SPACING.xs,
    flex: 1,
  },
  
  counterContainer: {
    alignItems: 'flex-end',
    marginTop: SPACING.xs,
    marginHorizontal: SPACING.md,
  },
  
  counterText: {
    fontSize: 12,
  },
  
  searchContainer: {
    marginBottom: SPACING.sm,
  },
  
  searchInputContainer: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: SPACING.md,
  },
  
  searchIcon: {
    marginRight: SPACING.sm,
  },
  
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: SPACING.sm,
  },
  
  clearButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.sm,
  },
  
  selectContainer: {
    marginBottom: SPACING.sm,
  },
  
  selectInputContainer: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  
  selectContent: {
    flex: 1,
  },
  
  selectLabel: {
    marginBottom: SPACING.xs,
  },
  
  selectValue: {
    fontSize: 16,
  },
  
  selectIcon: {
    marginLeft: SPACING.sm,
  },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  optionsContainer: {
    width: width * 0.9,
    maxHeight: 400,
    borderRadius: BORDER_RADIUS.md,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  
  searchInModal: {
    margin: SPACING.md,
    marginBottom: 0,
  },
  
  optionsList: {
    maxHeight: 300,
  },
  
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E0E0E0',
  },
  
  optionIcon: {
    marginRight: SPACING.sm,
  },
  
  optionText: {
    flex: 1,
    fontSize: 16,
  },
  
  checkIcon: {
    marginLeft: SPACING.sm,
  },
});

export default TextField;