import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Switch,
  TextInput,
  Alert,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Participant } from './ParticipantCard';
import { SpotlightData } from './SpotlightParticipant';

interface SpotlightControlsProps {
  participants: Participant[];
  activeSpotlights: SpotlightData[];
  onAddSpotlight: (participantId: string, spotlight: Omit<SpotlightData, 'participant'>) => void;
  onRemoveSpotlight: (participantId: string) => void;
  onUpdateSpotlight: (participantId: string, updates: Partial<SpotlightData>) => void;
  maxSpotlights: number;
  autoRotationEnabled: boolean;
  rotationInterval: number;
  onSettingsChange: (settings: { maxSpotlights: number; autoRotationEnabled: boolean; rotationInterval: number }) => void;
}

export interface SpotlightSettings {
  maxSpotlights: number;
  autoRotationEnabled: boolean;
  rotationInterval: number;
  defaultDuration: number;
  allowStudentRequests: boolean;
  priorityWeighting: boolean;
  notificationSound: boolean;
}

const { width } = Dimensions.get('window');

const SpotlightControls: React.FC<SpotlightControlsProps> = ({
  participants,
  activeSpotlights,
  onAddSpotlight,
  onRemoveSpotlight,
  onUpdateSpotlight,
  maxSpotlights,
  autoRotationEnabled,
  rotationInterval,
  onSettingsChange,
}) => {
  const { theme } = useTheme();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showBulkModal, setBulkModal] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<string>('');
  const [spotlightType, setSpotlightType] = useState<SpotlightData['type']>('presentation');
  const [priority, setPriority] = useState<SpotlightData['priority']>('medium');
  const [duration, setDuration] = useState('300');
  const [reason, setReason] = useState('');
  const [settings, setSettings] = useState<SpotlightSettings>({
    maxSpotlights,
    autoRotationEnabled,
    rotationInterval,
    defaultDuration: 300,
    allowStudentRequests: true,
    priorityWeighting: true,
    notificationSound: true,
  });
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);

  const spotlightTypes: Array<{ value: SpotlightData['type']; label: string; description: string }> = [
    { value: 'presentation', label: 'Presentation', description: 'Student presenting to class' },
    { value: 'question', label: 'Question', description: 'Student asking a question' },
    { value: 'achievement', label: 'Achievement', description: 'Celebrating student success' },
    { value: 'assistance', label: 'Assistance', description: 'Student needs help' },
    { value: 'manual', label: 'Manual', description: 'Teacher-directed spotlight' },
  ];

  const priorities: Array<{ value: SpotlightData['priority']; label: string; color: string }> = [
    { value: 'high', label: 'High Priority', color: theme.error },
    { value: 'medium', label: 'Medium Priority', color: '#FF9800' },
    { value: 'low', label: 'Low Priority', color: '#4CAF50' },
  ];

  const availableParticipants = participants.filter(
    p => !activeSpotlights.some(s => s.participant.id === p.id)
  );

  const handleAddSpotlight = () => {
    if (!selectedParticipant || !duration) {
      Alert.alert('error', 'Please select a participant and set duration');
      return;
    }

    if (activeSpotlights.length >= maxSpotlights) {
      Alert.alert('error', `Maximum ${maxSpotlights} spotlights allowed`);
      return;
    }

    const spotlight: Omit<SpotlightData, 'participant'> = {
      id: Date.now().toString(),
      type: spotlightType,
      priority,
      duration: parseInt(duration),
      remainingTime: parseInt(duration),
      reason: reason.trim() || `${spotlightType} spotlight`,
      isActive: true,
      queuePosition: activeSpotlights.length + 1,
    };

    onAddSpotlight(selectedParticipant, spotlight);
    
    // Reset form
    setSelectedParticipant('');
    setReason('');
    setDuration('300');
    setShowAddModal(false);
  };

  const handleBulkAction = (action: 'add' | 'remove') => {
    if (selectedParticipants.length === 0) {
      Alert.alert('error', 'Please select participants');
      return;
    }

    if (action === 'add') {
      if (activeSpotlights.length + selectedParticipants.length > maxSpotlights) {
        Alert.alert('error', `Cannot exceed ${maxSpotlights} spotlights`);
        return;
      }

      selectedParticipants.forEach(participantId => {
        const spotlight: Omit<SpotlightData, 'participant'> = {
          id: Date.now().toString() + participantId,
          type: 'manual',
          priority: 'medium',
          duration: parseInt(duration),
          remainingTime: parseInt(duration),
          reason: 'Bulk spotlight',
          isActive: true,
          queuePosition: activeSpotlights.length + 1,
        };
        onAddSpotlight(participantId, spotlight);
      });
    } else {
      selectedParticipants.forEach(participantId => {
        onRemoveSpotlight(participantId);
      });
    }

    setSelectedParticipants([]);
    setBulkModal(false);
  };

  const handleSettingsSave = () => {
    onSettingsChange({
      maxSpotlights: settings.maxSpotlights,
      autoRotationEnabled: settings.autoRotationEnabled,
      rotationInterval: settings.rotationInterval,
    });
    setShowSettingsModal(false);
  };

  const renderAddModal = () => (
    <Modal
      visible={showAddModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowAddModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Add Participant to Spotlight</Text>
          
          <ScrollView style={styles.modalScroll}>
            {/* Participant Selection */}
            <Text style={styles.sectionTitle}>Select Participant</Text>
            {availableParticipants.map(participant => (
              <TouchableOpacity
                key={participant.id}
                style={[
                  styles.participantOption,
                  selectedParticipant === participant.id && styles.selectedOption
                ]}
                onPress={() => setSelectedParticipant(participant.id)}
              >
                <View style={styles.participantInfo}>
                  <View style={[styles.avatar, { backgroundColor: participant.role === 'teacher' ? theme.primary : theme.secondary }]}>
                    <Text style={styles.avatarText}>{participant.name.charAt(0)}</Text>
                  </View>
                  <View>
                    <Text style={styles.participantName}>{participant.name}</Text>
                    <Text style={styles.participantRole}>{participant.role}</Text>
                  </View>
                </View>
                {selectedParticipant === participant.id && (
                  <View style={styles.selectedIndicator} />
                )}
              </TouchableOpacity>
            ))}

            {/* Spotlight Type */}
            <Text style={styles.sectionTitle}>Spotlight Type</Text>
            {spotlightTypes.map(type => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.typeOption,
                  spotlightType === type.value && styles.selectedOption
                ]}
                onPress={() => setSpotlightType(type.value)}
              >
                <View>
                  <Text style={styles.typeLabel}>{type.label}</Text>
                  <Text style={styles.typeDescription}>{type.description}</Text>
                </View>
                {spotlightType === type.value && (
                  <View style={styles.selectedIndicator} />
                )}
              </TouchableOpacity>
            ))}

            {/* Priority */}
            <Text style={styles.sectionTitle}>Priority Level</Text>
            {priorities.map(p => (
              <TouchableOpacity
                key={p.value}
                style={[
                  styles.priorityOption,
                  priority === p.value && styles.selectedOption
                ]}
                onPress={() => setPriority(p.value)}
              >
                <View style={[styles.priorityIndicator, { backgroundColor: p.color }]} />
                <Text style={styles.priorityLabel}>{p.label}</Text>
                {priority === p.value && (
                  <View style={styles.selectedIndicator} />
                )}
              </TouchableOpacity>
            ))}

            {/* Duration */}
            <Text style={styles.sectionTitle}>Duration (seconds)</Text>
            <TextInput
              style={styles.durationInput}
              value={duration}
              onChangeText={setDuration}
              placeholder="300"
              keyboardType="numeric"
              placeholderTextColor={theme.OnSurfaceVariant}
            />

            {/* Reason */}
            <Text style={styles.sectionTitle}>Reason (Optional)</Text>
            <TextInput
              style={styles.reasonInput}
              value={reason}
              onChangeText={setReason}
              placeholder="Enter reason for spotlight..."
              multiline
              numberOfLines={3}
              placeholderTextColor={theme.OnSurfaceVariant}
            />
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowAddModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.addButton]}
              onPress={handleAddSpotlight}
            >
              <Text style={styles.addButtonText}>Add Spotlight</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderSettingsModal = () => (
    <Modal
      visible={showSettingsModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowSettingsModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Spotlight Settings</Text>
          
          <ScrollView style={styles.modalScroll}>
            {/* Max Spotlights */}
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Maximum Simultaneous Spotlights</Text>
              <TextInput
                style={styles.settingInput}
                value={settings.maxSpotlights.toString()}
                onChangeText={(value) => setSettings(prev => ({ ...prev, maxSpotlights: parseInt(value) || 3 }))}
                keyboardType="numeric"
              />
            </View>

            {/* Auto Rotation */}
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Auto Rotation</Text>
              <Switch
                value={settings.autoRotationEnabled}
                onValueChange={(value) => setSettings(prev => ({ ...prev, autoRotationEnabled: value }))}
                trackColor={{ false: theme.Outline, true: theme.primary }}
                thumbColor={settings.autoRotationEnabled ? theme.OnPrimary : theme.OnSurfaceVariant}
              />
            </View>

            {/* Rotation Interval */}
            {settings.autoRotationEnabled && (
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Rotation Interval (seconds)</Text>
                <TextInput
                  style={styles.settingInput}
                  value={settings.rotationInterval.toString()}
                  onChangeText={(value) => setSettings(prev => ({ ...prev, rotationInterval: parseInt(value) || 30 }))}
                  keyboardType="numeric"
                />
              </View>
            )}

            {/* Default Duration */}
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Default Spotlight Duration (seconds)</Text>
              <TextInput
                style={styles.settingInput}
                value={settings.defaultDuration.toString()}
                onChangeText={(value) => setSettings(prev => ({ ...prev, defaultDuration: parseInt(value) || 300 }))}
                keyboardType="numeric"
              />
            </View>

            {/* Student Requests */}
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Allow Student Requests</Text>
              <Switch
                value={settings.allowStudentRequests}
                onValueChange={(value) => setSettings(prev => ({ ...prev, allowStudentRequests: value }))}
                trackColor={{ false: theme.Outline, true: theme.primary }}
                thumbColor={settings.allowStudentRequests ? theme.OnPrimary : theme.OnSurfaceVariant}
              />
            </View>

            {/* Priority Weighting */}
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Priority-Based Queue</Text>
              <Switch
                value={settings.priorityWeighting}
                onValueChange={(value) => setSettings(prev => ({ ...prev, priorityWeighting: value }))}
                trackColor={{ false: theme.Outline, true: theme.primary }}
                thumbColor={settings.priorityWeighting ? theme.OnPrimary : theme.OnSurfaceVariant}
              />
            </View>

            {/* Notification Sound */}
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Notification Sound</Text>
              <Switch
                value={settings.notificationSound}
                onValueChange={(value) => setSettings(prev => ({ ...prev, notificationSound: value }))}
                trackColor={{ false: theme.Outline, true: theme.primary }}
                thumbColor={settings.notificationSound ? theme.OnPrimary : theme.OnSurfaceVariant}
              />
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowSettingsModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.addButton]}
              onPress={handleSettingsSave}
            >
              <Text style={styles.addButtonText}>Save Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderBulkModal = () => (
    <Modal
      visible={showBulkModal}
      transparent
      animationType="slide"
      onRequestClose={() => setBulkModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Bulk Spotlight Actions</Text>
          
          <ScrollView style={styles.modalScroll}>
            <Text style={styles.sectionTitle}>Select Participants</Text>
            {participants.map(participant => (
              <TouchableOpacity
                key={participant.id}
                style={[
                  styles.participantOption,
                  selectedParticipants.includes(participant.id) && styles.selectedOption
                ]}
                onPress={() => {
                  setSelectedParticipants(prev => 
                    prev.includes(participant.id)
                      ? prev.filter(id => id !== participant.id)
                      : [...prev, participant.id]
                  );
                }}
              >
                <View style={styles.participantInfo}>
                  <View style={[styles.avatar, { backgroundColor: participant.role === 'teacher' ? theme.primary : theme.secondary }]}>
                    <Text style={styles.avatarText}>{participant.name.charAt(0)}</Text>
                  </View>
                  <View>
                    <Text style={styles.participantName}>{participant.name}</Text>
                    <Text style={styles.participantRole}>{participant.role}</Text>
                  </View>
                </View>
                {selectedParticipants.includes(participant.id) && (
                  <View style={styles.selectedIndicator} />
                )}
              </TouchableOpacity>
            ))}

            <Text style={styles.sectionTitle}>Duration for New Spotlights (seconds)</Text>
            <TextInput
              style={styles.durationInput}
              value={duration}
              onChangeText={setDuration}
              placeholder="300"
              keyboardType="numeric"
              placeholderTextColor={theme.OnSurfaceVariant}
            />
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setBulkModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.addButton]}
              onPress={() => handleBulkAction('add')}
            >
              <Text style={styles.addButtonText}>Add Selected</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.removeButton]}
              onPress={() => handleBulkAction('remove')}
            >
              <Text style={styles.removeButtonText}>Remove Selected</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const styles = getStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Spotlight Controls</Text>
        <Text style={styles.subtitle}>
          Active: {activeSpotlights.length}/{maxSpotlights} spotlights
        </Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[
            styles.controlButton,
            styles.addButton,
            activeSpotlights.length >= maxSpotlights && styles.disabledButton
          ]}
          onPress={() => setShowAddModal(true)}
          disabled={activeSpotlights.length >= maxSpotlights}
        >
          <Text style={[
            styles.addButtonText,
            activeSpotlights.length >= maxSpotlights && styles.disabledText
          ]}>
            Add Spotlight
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, styles.settingsButton]}
          onPress={() => setShowSettingsModal(true)}
        >
          <Text style={styles.settingsButtonText}>Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, styles.bulkButton]}
          onPress={() => setBulkModal(true)}
        >
          <Text style={styles.bulkButtonText}>Bulk Actions</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{activeSpotlights.filter(s => s.priority === 'high').length}</Text>
          <Text style={styles.statLabel}>High Priority</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{availableParticipants.length}</Text>
          <Text style={styles.statLabel}>Available</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {autoRotationEnabled ? `${Math.floor(rotationInterval / 60)}m` : 'Off'}
          </Text>
          <Text style={styles.statLabel}>Auto Rotation</Text>
        </View>
      </View>

      {renderAddModal()}
      {renderSettingsModal()}
      {renderBulkModal()}
    </View>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    backgroundColor: theme.Surface,
    borderRadius: 12,
    padding: 16,
    margin: 8,
    elevation: 2,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.OnSurface,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: theme.OnSurfaceVariant,
  },
  controls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  controlButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 100,
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: theme.primary,
  },
  addButtonText: {
    color: theme.OnPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  settingsButton: {
    backgroundColor: theme.Tertiary,
  },
  settingsButtonText: {
    color: theme.OnTertiary,
    fontSize: 14,
    fontWeight: '500',
  },
  bulkButton: {
    backgroundColor: theme.secondary,
  },
  bulkButtonText: {
    color: theme.OnSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  removeButton: {
    backgroundColor: theme.error,
  },
  removeButtonText: {
    color: theme.OnError,
    fontSize: 14,
    fontWeight: '500',
  },
  disabledButton: {
    backgroundColor: theme.Outline,
  },
  disabledText: {
    color: theme.OnSurfaceVariant,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.Outline,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: theme.OnSurfaceVariant,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.Surface,
    borderRadius: 16,
    width: width * 0.9,
    maxHeight: '80%',
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.OnSurface,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalScroll: {
    maxHeight: 400,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.OnSurface,
    marginTop: 16,
    marginBottom: 8,
  },
  participantOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    marginBottom: 4,
    backgroundColor: theme.SurfaceVariant,
  },
  selectedOption: {
    backgroundColor: theme.primaryContainer,
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: theme.OnPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  participantName: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.OnSurface,
  },
  participantRole: {
    fontSize: 12,
    color: theme.OnSurfaceVariant,
    textTransform: 'capitalize',
  },
  selectedIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.primary,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    marginBottom: 4,
    backgroundColor: theme.SurfaceVariant,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.OnSurface,
  },
  typeDescription: {
    fontSize: 12,
    color: theme.OnSurfaceVariant,
    marginTop: 2,
  },
  priorityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    marginBottom: 4,
    backgroundColor: theme.SurfaceVariant,
  },
  priorityIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  priorityLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.OnSurface,
    flex: 1,
  },
  durationInput: {
    borderWidth: 1,
    borderColor: theme.Outline,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: theme.OnSurface,
    backgroundColor: theme.Surface,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: theme.Outline,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: theme.OnSurface,
    backgroundColor: theme.Surface,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.Outline,
  },
  settingLabel: {
    fontSize: 14,
    color: theme.OnSurface,
    flex: 1,
  },
  settingInput: {
    borderWidth: 1,
    borderColor: theme.Outline,
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    color: theme.OnSurface,
    backgroundColor: theme.Surface,
    minWidth: 80,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    gap: 12,
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: theme.Outline,
  },
  cancelButtonText: {
    color: theme.OnSurfaceVariant,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default SpotlightControls;