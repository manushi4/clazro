import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  SegmentedButtons,
  Chip,
  Switch,
  Divider,
  Portal,
  Modal,
  Snackbar,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAppTheme } from '../../theme/useAppTheme';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTeacherClassesQuery } from '../../hooks/queries/teacher';
import { useCreateAssignment } from '../../hooks/mutations/teacher';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AssignmentType } from '../../hooks/queries/teacher/useTeacherAssignmentsQuery';

type Props = NativeStackScreenProps<any, 'AssignmentCreate'>;

const ASSIGNMENT_TYPES: { value: AssignmentType; label: string; icon: string }[] = [
  { value: 'homework', label: 'Homework', icon: 'book-open-outline' },
  { value: 'quiz', label: 'Quiz', icon: 'help-circle-outline' },
  { value: 'test', label: 'Test', icon: 'clipboard-text-outline' },
  { value: 'project', label: 'Project', icon: 'folder-star-outline' },
  { value: 'classwork', label: 'Classwork', icon: 'pencil-outline' },
];

export const AssignmentCreateScreen: React.FC<Props> = ({ navigation, route }) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation('teacher');
  const rubricTemplateId = route.params?.rubricTemplate;

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [assignmentType, setAssignmentType] = useState<AssignmentType>('homework');
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [chapter, setChapter] = useState('');
  const [maxScore, setMaxScore] = useState('100');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [allowLateSubmission, setAllowLateSubmission] = useState(true);
  const [latePenalty, setLatePenalty] = useState('10');
  const [requiresFileUpload, setRequiresFileUpload] = useState(false);

  // UI state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);

  // Data
  const { data: classes } = useTeacherClassesQuery();
  const createAssignment = useCreateAssignment();

  const selectedClass = classes?.find(c => c.id === selectedClassId);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDueDate(selectedDate);
    }
  };

  const handleSubmit = async (asDraft: boolean = false) => {
    if (!title.trim()) {
      setSnackbarMessage(t('screens.assignmentCreate.errors.titleRequired', { defaultValue: 'Title is required' }));
      setSnackbarVisible(true);
      return;
    }

    try {
      await createAssignment.mutateAsync({
        title_en: title,
        description_en: description || undefined,
        instructions_en: instructions || undefined,
        assignment_type: assignmentType,
        classId: selectedClassId || undefined,
        chapter: chapter || undefined,
        max_score: parseInt(maxScore) || 100,
        due_date: dueDate?.toISOString() || undefined,
        allow_late_submission: allowLateSubmission,
        late_penalty_percent: parseInt(latePenalty) || 10,
        requires_file_upload: requiresFileUpload,
        status: asDraft ? 'draft' : 'published',
      });

      setSnackbarMessage(
        asDraft
          ? t('screens.assignmentCreate.success.draft', { defaultValue: 'Assignment saved as draft' })
          : t('screens.assignmentCreate.success.published', { defaultValue: 'Assignment published!' })
      );
      setSnackbarVisible(true);

      setTimeout(() => {
        navigation.goBack();
      }, 1000);
    } catch (error) {
      setSnackbarMessage(t('screens.assignmentCreate.errors.failed', { defaultValue: 'Failed to create assignment' }));
      setSnackbarVisible(true);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.outline }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.onSurface }]}>
          {t('screens.assignmentCreate.title', { defaultValue: 'Create Assignment' })}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Title */}
          <TextInput
            mode="outlined"
            label={t('screens.assignmentCreate.form.title', { defaultValue: 'Assignment Title' })}
            value={title}
            onChangeText={setTitle}
            style={styles.input}
          />

          {/* Assignment Type */}
          <Text style={[styles.label, { color: colors.onSurface }]}>
            {t('screens.assignmentCreate.form.type', { defaultValue: 'Type' })}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
            {ASSIGNMENT_TYPES.map((type) => (
              <TouchableOpacity
                key={type.value}
                onPress={() => setAssignmentType(type.value)}
                style={[
                  styles.typeChip,
                  {
                    backgroundColor: assignmentType === type.value ? colors.primary : colors.surfaceVariant,
                    borderRadius: borderRadius.medium,
                  }
                ]}
              >
                <Icon
                  name={type.icon}
                  size={18}
                  color={assignmentType === type.value ? colors.onPrimary : colors.onSurfaceVariant}
                />
                <Text
                  style={{
                    color: assignmentType === type.value ? colors.onPrimary : colors.onSurfaceVariant,
                    marginLeft: 6,
                    fontWeight: '500',
                  }}
                >
                  {t(`screens.assignmentCreate.types.${type.value}`, { defaultValue: type.label })}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Class Selection */}
          <Text style={[styles.label, { color: colors.onSurface }]}>
            {t('screens.assignmentCreate.form.class', { defaultValue: 'Assign to Class' })}
          </Text>
          <TouchableOpacity
            onPress={() => setShowClassPicker(true)}
            style={[styles.selectBtn, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}
          >
            <Icon name="google-classroom" size={20} color={colors.onSurfaceVariant} />
            <Text style={[styles.selectBtnText, { color: selectedClass ? colors.onSurface : colors.onSurfaceVariant }]}>
              {selectedClass?.title_en || t('screens.assignmentCreate.form.selectClass', { defaultValue: 'Select a class...' })}
            </Text>
            <Icon name="chevron-down" size={20} color={colors.onSurfaceVariant} />
          </TouchableOpacity>

          {/* Description */}
          <TextInput
            mode="outlined"
            label={t('screens.assignmentCreate.form.description', { defaultValue: 'Description (Optional)' })}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            style={styles.input}
          />

          {/* Instructions */}
          <TextInput
            mode="outlined"
            label={t('screens.assignmentCreate.form.instructions', { defaultValue: 'Instructions (Optional)' })}
            value={instructions}
            onChangeText={setInstructions}
            multiline
            numberOfLines={4}
            style={styles.input}
          />

          <Divider style={styles.divider} />

          {/* Scoring */}
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
            {t('screens.assignmentCreate.sections.scoring', { defaultValue: 'Scoring' })}
          </Text>
          <View style={styles.row}>
            <TextInput
              mode="outlined"
              label={t('screens.assignmentCreate.form.maxScore', { defaultValue: 'Max Score' })}
              value={maxScore}
              onChangeText={setMaxScore}
              keyboardType="numeric"
              style={[styles.input, { flex: 1, marginRight: 8 }]}
            />
            <TextInput
              mode="outlined"
              label={t('screens.assignmentCreate.form.chapter', { defaultValue: 'Chapter/Unit' })}
              value={chapter}
              onChangeText={setChapter}
              style={[styles.input, { flex: 1, marginLeft: 8 }]}
            />
          </View>

          <Divider style={styles.divider} />

          {/* Due Date */}
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
            {t('screens.assignmentCreate.sections.deadline', { defaultValue: 'Deadline' })}
          </Text>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={[styles.selectBtn, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}
          >
            <Icon name="calendar" size={20} color={colors.onSurfaceVariant} />
            <Text style={[styles.selectBtnText, { color: dueDate ? colors.onSurface : colors.onSurfaceVariant }]}>
              {dueDate?.toLocaleDateString() || t('screens.assignmentCreate.form.selectDueDate', { defaultValue: 'Select due date...' })}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={dueDate || new Date()}
              mode="date"
              display="default"
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}

          {/* Late Submission */}
          <View style={[styles.switchRow, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}>
            <View style={styles.switchContent}>
              <Icon name="clock-alert-outline" size={20} color={colors.onSurfaceVariant} />
              <View style={styles.switchText}>
                <Text style={[styles.switchLabel, { color: colors.onSurface }]}>
                  {t('screens.assignmentCreate.form.allowLate', { defaultValue: 'Allow Late Submission' })}
                </Text>
                {allowLateSubmission && (
                  <Text style={[styles.switchSublabel, { color: colors.onSurfaceVariant }]}>
                    {t('screens.assignmentCreate.form.latePenalty', { defaultValue: `${latePenalty}% penalty` })}
                  </Text>
                )}
              </View>
            </View>
            <Switch value={allowLateSubmission} onValueChange={setAllowLateSubmission} />
          </View>

          {/* File Upload */}
          <View style={[styles.switchRow, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}>
            <View style={styles.switchContent}>
              <Icon name="file-upload-outline" size={20} color={colors.onSurfaceVariant} />
              <Text style={[styles.switchLabel, { color: colors.onSurface }]}>
                {t('screens.assignmentCreate.form.requireFile', { defaultValue: 'Require File Upload' })}
              </Text>
            </View>
            <Switch value={requiresFileUpload} onValueChange={setRequiresFileUpload} />
          </View>

          <View style={styles.spacer} />
        </ScrollView>

        {/* Action Buttons */}
        <View style={[styles.actions, { borderTopColor: colors.outline }]}>
          <Button
            mode="outlined"
            onPress={() => handleSubmit(true)}
            loading={createAssignment.isPending}
            style={styles.actionBtn}
          >
            {t('screens.assignmentCreate.actions.saveDraft', { defaultValue: 'Save as Draft' })}
          </Button>
          <Button
            mode="contained"
            onPress={() => handleSubmit(false)}
            loading={createAssignment.isPending}
            style={styles.actionBtn}
          >
            {t('screens.assignmentCreate.actions.publish', { defaultValue: 'Publish' })}
          </Button>
        </View>
      </KeyboardAvoidingView>

      {/* Class Picker Modal */}
      <Portal>
        <Modal
          visible={showClassPicker}
          onDismiss={() => setShowClassPicker(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: colors.surface }]}
        >
          <Text style={[styles.modalTitle, { color: colors.onSurface }]}>
            {t('screens.assignmentCreate.form.selectClass', { defaultValue: 'Select Class' })}
          </Text>
          <ScrollView style={styles.modalList}>
            {classes?.map((cls) => (
              <TouchableOpacity
                key={cls.id}
                onPress={() => {
                  setSelectedClassId(cls.id);
                  setShowClassPicker(false);
                }}
                style={[
                  styles.modalItem,
                  {
                    backgroundColor: selectedClassId === cls.id ? `${colors.primary}15` : 'transparent',
                    borderRadius: borderRadius.small,
                  }
                ]}
              >
                <Icon
                  name={selectedClassId === cls.id ? 'radiobox-marked' : 'radiobox-blank'}
                  size={20}
                  color={selectedClassId === cls.id ? colors.primary : colors.onSurfaceVariant}
                />
                <Text style={[styles.modalItemText, { color: colors.onSurface }]}>
                  {cls.title_en}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Modal>
      </Portal>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={2000}
      >
        {snackbarMessage}
      </Snackbar>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  content: { flex: 1, padding: 16 },
  input: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  typeScroll: { marginBottom: 16 },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 8,
  },
  selectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
    marginBottom: 16,
  },
  selectBtnText: { flex: 1, fontSize: 14 },
  row: { flexDirection: 'row', alignItems: 'center' },
  divider: { marginVertical: 20 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    marginBottom: 12,
  },
  switchContent: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  switchText: { flex: 1 },
  switchLabel: { fontSize: 14, fontWeight: '500' },
  switchSublabel: { fontSize: 12, marginTop: 2 },
  spacer: { height: 100 },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  actionBtn: { flex: 1 },
  modal: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    maxHeight: '60%',
  },
  modalTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
  modalList: { maxHeight: 300 },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  modalItemText: { fontSize: 14 },
});

export default AssignmentCreateScreen;
