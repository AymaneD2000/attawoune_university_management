import React, { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AcademicCapIcon, UserIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog';
import { DialogShell } from '../../components/ui/DialogShell';
import { Field } from '../../components/ui/Field';
import { FormSection, StickyFormActions } from '../../components/ui/FormSection';
import studentService from '../../services/studentService';
import universityService from '../../services/universityService';
import userService from '../../services/userService';
import { Level, Program, Student, User } from '../../types';
import {
  getFieldError,
  normalizeApiError,
  NormalizedApiError,
} from '../../utils/apiError';
import { changedFields, hasChangedFields } from '../../utils/partialUpdate';
import { studentQueryKeys } from './studentQueries';

interface StudentFormModalProps {
  onClose: () => void;
  onSuccess: (savedStudent?: Student) => void;
  student?: Student | null;
}

const FIELD_ORDER = [
  'first_name',
  'last_name',
  'first_name_ar',
  'last_name_ar',
  'email',
  'date_of_birth',
  'gender',
  'photo',
  'address',
  'address_ar',
  'program',
  'current_level',
  'enrollment_date',
  'guardian_name',
] as const;

const STEP_ONE_FIELDS = new Set<string>(FIELD_ORDER.slice(0, 10));
const FIELD_IDS: Record<(typeof FIELD_ORDER)[number], string> = {
  first_name: 'student-first-name',
  last_name: 'student-last-name',
  first_name_ar: 'student-first-name-ar',
  last_name_ar: 'student-last-name-ar',
  email: 'student-email',
  date_of_birth: 'student-date-of-birth',
  gender: 'student-gender',
  photo: 'student-photo',
  address: 'student-address',
  address_ar: 'student-address-ar',
  program: 'student-program',
  current_level: 'student-current-level',
  enrollment_date: 'student-enrollment-date',
  guardian_name: 'student-guardian-name',
};

const StudentFormModal: React.FC<StudentFormModalProps> = ({
  onClose,
  onSuccess,
  student,
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<NormalizedApiError | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const fieldRefs = useRef<Record<string, HTMLElement | null>>({});
  const pendingAutomaticFocusRef = useRef<NormalizedApiError | null>(null);

  const [userData, setUserData] = useState({
    first_name: '',
    last_name: '',
    first_name_ar: '',
    last_name_ar: '',
    email: '',
    username: '',
    role: 'STUDENT' as const,
    phone: '',
    address: '',
    address_ar: '',
    date_of_birth: '',
    gender: 'M',
  });

  const [studentData, setStudentData] = useState({
    program: student?.program ? String(student.program) : '',
    current_level: student?.current_level ? String(student.current_level) : '',
    enrollment_date: student?.enrollment_date || new Date().toISOString().split('T')[0],
    status: student?.status || 'ACTIVE',
    guardian_name: student?.guardian_name || '',
    guardian_phone: student?.guardian_phone || '',
    emergency_contact: student?.emergency_contact || '',
  });
  const initialUserDataRef = useRef(userData);
  const initialStudentDataRef = useRef(studentData);

  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(student?.photo || null);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);

  const dirty = photo !== null
    || hasChangedFields(changedFields(userData, initialUserDataRef.current))
    || hasChangedFields(changedFields(studentData, initialStudentDataRef.current));

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [programsRes, levelsRes] = await Promise.all([
          universityService.getPrograms({ page_size: 100 }),
          universityService.getLevels({ page_size: 100 }),
        ]);
        setPrograms(programsRes.results);
        setLevels(levelsRes.results);
      } catch (fetchError) {
        console.error('Error fetching options:', fetchError);
      }
    };
    void fetchOptions();
  }, []);

  useEffect(() => {
    if (student) {
      const populateForm = async () => {
        try {
          const userId = typeof student.user === 'object'
            ? (student.user as any).id
            : student.user;

          let user: User | null = null;
          if (userId) {
            if (typeof student.user === 'object' && (student.user as any).email) {
              user = student.user as any;
            } else {
              user = await userService.getUser(userId);
            }
          }

          if (user) {
            const populatedUserData = {
              first_name: user.first_name || '',
              last_name: user.last_name || '',
              first_name_ar: user.first_name_ar || '',
              last_name_ar: user.last_name_ar || '',
              email: user.email || '',
              username: user.username || '',
              role: 'STUDENT' as const,
              phone: user.phone || '',
              address: user.address || '',
              address_ar: user.address_ar || '',
              date_of_birth: user.date_of_birth || '',
              gender: user.gender || 'M',
            };
            setUserData(populatedUserData);
            initialUserDataRef.current = populatedUserData;
          }

          const populatedStudentData = {
            program: student.program ? String(student.program) : '',
            current_level: student.current_level ? String(student.current_level) : '',
            enrollment_date: student.enrollment_date || new Date().toISOString().split('T')[0],
            status: student.status || 'ACTIVE',
            guardian_name: student.guardian_name || '',
            guardian_phone: student.guardian_phone || '',
            emergency_contact: student.emergency_contact || '',
          };
          setStudentData(populatedStudentData);
          initialStudentDataRef.current = populatedStudentData;
        } catch (populateError) {
          console.error('Failed to populate form:', populateError);
        }
      };
      void populateForm();
    }
    setPhoto(null);
    setPhotoPreview(student?.photo || null);
  }, [student]);

  useEffect(() => {
    pendingAutomaticFocusRef.current = error;
    if (!error) return;

    const firstField = FIELD_ORDER.find((field) => error.fields[field]?.length);
    if (firstField) {
      const targetStep = STEP_ONE_FIELDS.has(firstField) ? 1 : 2;
      setStep(targetStep);
    }
  }, [error]);

  useEffect(() => {
    if (!error || pendingAutomaticFocusRef.current !== error) return undefined;

    const firstField = FIELD_ORDER.find((field) => error.fields[field]?.length);
    if (firstField) {
      const targetStep = STEP_ONE_FIELDS.has(firstField) ? 1 : 2;
      if (step !== targetStep) return undefined;
    }

    pendingAutomaticFocusRef.current = null;

    const focusTimer = window.setTimeout(() => {
      if (firstField && fieldRefs.current[firstField]) {
        fieldRefs.current[firstField]?.focus();
      } else {
        errorSummaryRef.current?.focus();
      }
    }, 0);

    return () => window.clearTimeout(focusTimer);
  }, [error, step]);

  const registerField = (field: string) => (element: HTMLElement | null) => {
    fieldRefs.current[field] = element;
  };

  const fieldError = (field: string) => getFieldError(error, field);

  const requestClose = () => {
    if (loading) return;
    if (dirty) {
      setConfirmDiscard(true);
      return;
    }
    onClose();
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedPhoto = event.target.files?.[0];
    if (!selectedPhoto) return;

    if (!selectedPhoto.type.startsWith('image/')) {
      const message = t(
        'students.form.errors.photo_type',
        'Veuillez sélectionner une image valide.',
      );
      setError({ message, fields: { photo: [message] } });
      event.target.value = '';
      return;
    }
    if (selectedPhoto.size > 5 * 1024 * 1024) {
      const message = t(
        'students.form.errors.photo_size',
        'La photo ne doit pas dépasser 5 Mo.',
      );
      setError({ message, fields: { photo: [message] } });
      event.target.value = '';
      return;
    }

    setError(null);
    setPhoto(selectedPhoto);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(String(reader.result || ''));
    reader.readAsDataURL(selectedPhoto);
  };

  const handleUserChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setUserData({ ...userData, [event.target.name]: event.target.value });
  };

  const handleStudentChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setStudentData({ ...studentData, [event.target.name]: event.target.value });
  };

  const validateStep1 = (): boolean => {
    const message = t(
      'students.form.errors.required_fields',
      'Veuillez remplir tous les champs obligatoires',
    );
    const fields: Record<string, string[]> = {};
    if (!userData.first_name) fields.first_name = [message];
    if (!userData.last_name) fields.last_name = [message];

    if (Object.keys(fields).length > 0) {
      setError({ message, fields });
      return false;
    }
    setError(null);
    return true;
  };

  const goToNextStep = () => {
    if (validateStep1()) setStep(2);
  };

  const handleFinalSubmit = async () => {
    setError(null);
    setLoading(true);

    try {
      let userId = typeof student?.user === 'object'
        ? (student.user as any).id
        : student?.user;
      let userWasUpdated = false;

      const randomNum = Math.floor(Math.random() * 900) + 100;
      const autoUsername = `etu_${userData.first_name.toLowerCase().replace(/\s/g, '_')}_${userData.last_name.toLowerCase().replace(/\s/g, '_')}_${randomNum}`;

      if (!student) {
        const birthYear = userData.date_of_birth
          ? new Date(userData.date_of_birth).getFullYear()
          : new Date().getFullYear();
        const generatedPassword = `${userData.first_name}${userData.last_name}@${birthYear}`.replace(/\s/g, '');
        const userPayload: any = {
          ...userData,
          username: autoUsername,
          password: generatedPassword,
          password_confirm: generatedPassword,
        };

        if (!userPayload.email) delete userPayload.email;
        if (!userPayload.date_of_birth) delete userPayload.date_of_birth;
        if (!userPayload.phone) delete userPayload.phone;
        if (!userPayload.address) delete userPayload.address;
        if (!userPayload.first_name_ar) delete userPayload.first_name_ar;
        if (!userPayload.last_name_ar) delete userPayload.last_name_ar;
        if (!userPayload.address_ar) delete userPayload.address_ar;

        const userResponse = await userService.createUser(userPayload);
        userId = userResponse.id;
      } else if (userId) {
        const userChanges: Record<string, any> = changedFields(
          userData,
          initialUserDataRef.current,
        );
        delete userChanges.username;
        delete userChanges.role;
        if ('date_of_birth' in userChanges && !userChanges.date_of_birth) {
          userChanges.date_of_birth = null;
        }
        if (hasChangedFields(userChanges)) {
          await userService.updateUser(userId, userChanges);
          userWasUpdated = true;
        }
      }

      const studentPayload = new FormData();
      if (!student) {
        studentPayload.append('user', String(userId));
        studentPayload.append('program', studentData.program);
        studentPayload.append('current_level', studentData.current_level);
        studentPayload.append('status', String(studentData.status || 'ACTIVE'));
        studentPayload.append('enrollment_date', studentData.enrollment_date);
        if (studentData.guardian_name) studentPayload.append('guardian_name', studentData.guardian_name);
        if (studentData.guardian_phone) studentPayload.append('guardian_phone', studentData.guardian_phone);
        if (studentData.emergency_contact) studentPayload.append('emergency_contact', studentData.emergency_contact);
      } else {
        const studentChanges = changedFields(
          studentData,
          initialStudentDataRef.current,
        );
        Object.entries(studentChanges).forEach(([field, value]) => {
          studentPayload.append(field, String(value ?? ''));
        });
      }

      if (photo) studentPayload.append('photo', photo);

      let savedStudent: Student;
      if (student) {
        if (Array.from(studentPayload.keys()).length > 0) {
          savedStudent = await studentService.updateStudent(student.id, studentPayload);
        } else if (userWasUpdated) {
          savedStudent = await studentService.getStudent(student.id);
        } else {
          savedStudent = student;
        }
      } else {
        savedStudent = await studentService.createStudent(studentPayload);
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: studentQueryKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: studentQueryKeys.summaries() }),
        ...(student && savedStudent.id
          ? [queryClient.invalidateQueries({
            queryKey: studentQueryKeys.detail(savedStudent.id),
            exact: true,
          })]
          : []),
        ...(student && photo && savedStudent.id
          ? [queryClient.invalidateQueries({
            queryKey: studentQueryKeys.idCard(savedStudent.id),
            exact: true,
          })]
          : []),
      ]);

      onSuccess(savedStudent);
      onClose();
    } catch (saveError: any) {
      console.error('Error saving student:', saveError);
      setError(normalizeApiError(
        saveError.response?.data,
        t('students.form.errors.save_error', 'Erreur lors de la sauvegarde'),
      ));
    } finally {
      setLoading(false);
    }
  };

  const errorFieldEntries = error
    ? FIELD_ORDER.flatMap((field) => {
      const messages = error.fields[field];
      return messages?.length ? [{ field, message: messages.join(' ') }] : [];
    })
    : [];

  const stepIndicator = (
    <div className="rounded-[var(--radius-panel)] border border-ui-border bg-ui-surface px-4 py-3 shadow-panel">
      <div className="mx-auto flex max-w-md items-center" aria-label={t('students.form.steps.progress', 'Progression du formulaire')}>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ui-primary text-xs font-black text-ui-on-primary">1</span>
          <span className={`truncate text-sm font-black ${step === 1 ? 'text-ui-primary' : 'text-ui-muted'}`}>
            {t('students.form.steps.identity', 'Identité')}
          </span>
        </div>
        <div className={`mx-3 h-1 flex-1 rounded-full ${step >= 2 ? 'bg-ui-success-strong' : 'bg-ui-border'}`} />
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
          <span className={`truncate text-sm font-black ${step === 2 ? 'text-ui-success-strong' : 'text-ui-muted'}`}>
            {t('students.form.steps.academic', 'Scolarité')}
          </span>
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black ${step >= 2 ? 'bg-ui-success-strong text-ui-on-primary' : 'bg-ui-surface-muted text-ui-muted'}`}>2</span>
        </div>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <FormSection
      title={t('students.form.sections.user_info', 'Informations Utilisateur')}
      description={t('students.form.sections.user_description', 'Identité, coordonnées et photo du dossier étudiant.')}
      icon={<UserIcon className="h-5 w-5" aria-hidden="true" />}
    >
      <Field
        id="student-first-name"
        label={t('students.form.labels.first_name', 'Prénom')}
        required
        error={fieldError('first_name')}
      >
        <input
          ref={registerField('first_name') as React.Ref<HTMLInputElement>}
          type="text"
          name="first_name"
          value={userData.first_name}
          onChange={handleUserChange}
        />
      </Field>
      <Field
        id="student-last-name"
        label={t('students.form.labels.last_name', 'Nom')}
        required
        error={fieldError('last_name')}
      >
        <input
          ref={registerField('last_name') as React.Ref<HTMLInputElement>}
          type="text"
          name="last_name"
          value={userData.last_name}
          onChange={handleUserChange}
        />
      </Field>
      <Field
        id="student-first-name-ar"
        label={t('students.form.labels.first_name_ar', 'Prénom (arabe)')}
        error={fieldError('first_name_ar')}
      >
        <input
          ref={registerField('first_name_ar') as React.Ref<HTMLInputElement>}
          type="text"
          name="first_name_ar"
          dir="rtl"
          value={userData.first_name_ar}
          onChange={handleUserChange}
        />
      </Field>
      <Field
        id="student-last-name-ar"
        label={t('students.form.labels.last_name_ar', 'Nom (arabe)')}
        error={fieldError('last_name_ar')}
      >
        <input
          ref={registerField('last_name_ar') as React.Ref<HTMLInputElement>}
          type="text"
          name="last_name_ar"
          dir="rtl"
          value={userData.last_name_ar}
          onChange={handleUserChange}
        />
      </Field>
      <Field
        id="student-email"
        label={t('students.form.labels.email', 'Email')}
        error={fieldError('email')}
      >
        <input
          ref={registerField('email') as React.Ref<HTMLInputElement>}
          type="email"
          name="email"
          value={userData.email}
          onChange={handleUserChange}
        />
      </Field>
      <Field
        id="student-date-of-birth"
        label={t('students.form.labels.date_of_birth', 'Date de naissance')}
        error={fieldError('date_of_birth')}
      >
        <input
          ref={registerField('date_of_birth') as React.Ref<HTMLInputElement>}
          type="date"
          name="date_of_birth"
          value={userData.date_of_birth}
          onChange={handleUserChange}
        />
      </Field>
      <Field
        id="student-gender"
        label={t('students.form.labels.gender', 'Sexe')}
        error={fieldError('gender')}
      >
        <select
          ref={registerField('gender') as React.Ref<HTMLSelectElement>}
          name="gender"
          value={userData.gender}
          onChange={handleUserChange}
        >
          <option value="M">{t('admin.users.gender.M', 'Homme')}</option>
          <option value="F">{t('admin.users.gender.F', 'Femme')}</option>
        </select>
      </Field>

      <div className="md:col-span-2">
        <Field
          id="student-address"
          label={t('students.form.labels.address', 'Adresse (français)')}
          error={fieldError('address')}
        >
          <textarea
            ref={registerField('address') as React.Ref<HTMLTextAreaElement>}
            rows={2}
            name="address"
            value={userData.address}
            onChange={handleUserChange}
          />
        </Field>
      </div>
      <div className="md:col-span-2">
        <Field
          id="student-address-ar"
          label={t('students.form.labels.address_ar', 'Adresse (arabe)')}
          error={fieldError('address_ar')}
        >
          <textarea
            ref={registerField('address_ar') as React.Ref<HTMLTextAreaElement>}
            rows={2}
            name="address_ar"
            dir="rtl"
            value={userData.address_ar}
            onChange={handleUserChange}
          />
        </Field>
      </div>

      <div className="rounded-[var(--radius-control)] border border-ui-warning/35 bg-ui-warning/10 p-4 text-sm text-ui-foreground md:col-span-2">
        <span className="font-bold">{t('common.note', 'Note')}:</span>{' '}
        {student
          ? t('students.form.notes.password_admin', 'La modification du mot de passe doit se faire via l’administration des utilisateurs.')
          : t('students.form.notes.password_auto', 'Le mot de passe sera généré automatiquement (PrénomNom@Année).')}
      </div>

      <div className="flex flex-col gap-4 rounded-[var(--radius-panel)] border border-ui-border bg-ui-surface-muted p-4 md:col-span-2 sm:flex-row sm:items-center">
        <div className="flex h-24 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-panel)] bg-ui-primary/10 text-ui-primary ring-4 ring-ui-surface shadow-panel">
          {photoPreview ? (
            <img
              src={photoPreview}
              alt={t('students.form.labels.photo_preview', 'Aperçu de la photo')}
              className="h-full w-full object-cover"
            />
          ) : (
            <UserIcon className="h-10 w-10" aria-hidden="true" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <Field
            id="student-photo"
            label={t('students.form.labels.photo', 'Photo de profil')}
            hint={t('students.form.notes.photo_hint', 'JPG, PNG ou WebP, 5 Mo maximum. La carte d’étudiant sera actualisée automatiquement.')}
            error={fieldError('photo')}
          >
            <input
              ref={registerField('photo') as React.Ref<HTMLInputElement>}
              type="file"
              name="photo"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoChange}
              className="file:me-3 file:rounded-[var(--radius-control)] file:border-0 file:bg-ui-primary/10 file:px-4 file:py-2 file:text-sm file:font-bold file:text-ui-primary hover:file:bg-ui-primary/15"
            />
          </Field>
          {photo && <p className="mt-1 truncate text-xs font-bold text-ui-success-strong">{photo.name}</p>}
        </div>
      </div>
    </FormSection>
  );

  const renderStep2 = () => (
    <FormSection
      title={t('students.form.sections.academic_info', 'Informations Académiques')}
      description={t('students.form.sections.academic_description', 'Programme, niveau et informations d’inscription.')}
      icon={<AcademicCapIcon className="h-5 w-5" aria-hidden="true" />}
    >
      <div className="rounded-[var(--radius-control)] border border-ui-info/30 bg-ui-info/10 p-4 text-sm text-ui-foreground md:col-span-2">
        <span className="font-bold">{t('common.note', 'Note')}:</span>{' '}
        {t('students.form.notes.matricule_auto', 'Le matricule sera généré automatiquement (ex: FST1920MA007817).')}
      </div>
      <Field
        id="student-program"
        label={t('students.form.labels.program', 'Programme')}
        required
        error={fieldError('program')}
      >
        <select
          ref={registerField('program') as React.Ref<HTMLSelectElement>}
          name="program"
          value={studentData.program}
          onChange={handleStudentChange}
        >
          <option value="">{t('students.form.placeholders.select', 'Sélectionner')}</option>
          {programs.map((program) => (
            <option key={program.id} value={program.id}>{program.code} - {program.name}</option>
          ))}
        </select>
      </Field>
      <Field
        id="student-current-level"
        label={t('students.form.labels.level', 'Niveau')}
        required
        error={fieldError('current_level')}
      >
        <select
          ref={registerField('current_level') as React.Ref<HTMLSelectElement>}
          name="current_level"
          value={studentData.current_level}
          onChange={handleStudentChange}
          disabled={!studentData.program}
        >
          <option value="">{t('students.form.placeholders.select', 'Sélectionner')}</option>
          {levels
            .filter((level) => {
              if (!studentData.program) return false;
              const selectedProgram = programs.find(
                (program) => program.id === parseInt(studentData.program, 10),
              );
              return selectedProgram?.levels.includes(level.id);
            })
            .map((level) => (
              <option key={level.id} value={level.id}>{level.display_name}</option>
            ))}
        </select>
      </Field>
      <Field
        id="student-enrollment-date"
        label={t('students.form.labels.enrollment_date', "Date d'inscription")}
        error={fieldError('enrollment_date')}
      >
        <input
          ref={registerField('enrollment_date') as React.Ref<HTMLInputElement>}
          type="date"
          name="enrollment_date"
          value={studentData.enrollment_date}
          onChange={handleStudentChange}
        />
      </Field>
      <Field
        id="student-guardian-name"
        label={t('students.form.labels.guardian_name', 'Nom du tuteur')}
        error={fieldError('guardian_name')}
      >
        <input
          ref={registerField('guardian_name') as React.Ref<HTMLInputElement>}
          type="text"
          name="guardian_name"
          value={studentData.guardian_name}
          onChange={handleStudentChange}
        />
      </Field>
    </FormSection>
  );

  const footer = (
    <StickyFormActions>
      {step === 2 && (
        <Button variant="secondary" onClick={() => setStep(1)} disabled={loading}>
          {t('students.form.buttons.prev', 'Précédent')}
        </Button>
      )}
      {step === 1 ? (
        <>
          {student && (
            <Button
              variant="secondary"
              onClick={handleFinalSubmit}
              loading={loading}
              disabled={!userData.first_name || !userData.last_name}
            >
              {t('students.form.buttons.save_changes', 'Enregistrer les modifications')}
            </Button>
          )}
          <Button onClick={goToNextStep} disabled={loading}>
            {t('students.form.buttons.next', 'Suivant')}
          </Button>
        </>
      ) : (
        <Button onClick={handleFinalSubmit} loading={loading}>
          {student
            ? t('students.form.buttons.update', 'Enregistrer')
            : t('students.form.buttons.create', "Créer l'étudiant")}
        </Button>
      )}
    </StickyFormActions>
  );

  return (
    <>
      <DialogShell
        open
        title={student
          ? t('students.form.title_edit', 'Modifier Étudiant')
          : t('students.form.title_new', 'Nouvel Étudiant')}
        description={student
          ? t('students.form.edit_eyebrow', 'Mise à jour du dossier')
          : t('students.form.new_eyebrow', 'Nouvelle inscription')}
        onClose={requestClose}
        footer={footer}
        busy={loading}
      >
        <div className="space-y-4">
          {stepIndicator}
          {error && (
            <div
              ref={errorSummaryRef}
              role="alert"
              tabIndex={-1}
              aria-label={t('students.form.errors.summary_label', 'Erreurs du formulaire')}
              className="rounded-[var(--radius-panel)] border border-ui-danger/30 bg-ui-danger/10 p-4 text-sm text-ui-danger focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ui-ring/20"
            >
              <p className="font-bold">{error.message}</p>
              {errorFieldEntries.length > 0 && (
                <ul className="mt-2 list-disc space-y-1 ps-5">
                  {errorFieldEntries.map(({ field, message }) => (
                    <li key={field}>
                      <a
                        href={`#${FIELD_IDS[field]}`}
                        onClick={(event) => {
                          event.preventDefault();
                          const targetStep = STEP_ONE_FIELDS.has(field) ? 1 : 2;
                          if (targetStep !== step) {
                            setStep(targetStep);
                            window.setTimeout(() => fieldRefs.current[field]?.focus(), 0);
                          } else {
                            fieldRefs.current[field]?.focus();
                          }
                        }}
                        className="rounded-sm font-semibold underline decoration-current/50 underline-offset-2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ui-ring/20"
                      >
                        {message}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {step === 1 ? renderStep1() : renderStep2()}
        </div>
      </DialogShell>

      <ConfirmationDialog
        open={confirmDiscard}
        title={t('students.form.unsaved.title', 'Modifications non enregistrées')}
        description={t(
          'students.form.unsaved.description',
          'Vos modifications seront perdues si vous fermez ce formulaire.',
        )}
        confirmLabel={t('students.form.unsaved.discard', 'Abandonner les modifications')}
        cancelLabel={t('students.form.unsaved.keep_editing', 'Continuer la modification')}
        tone="danger"
        onCancel={() => setConfirmDiscard(false)}
        onConfirm={() => {
          setConfirmDiscard(false);
          onClose();
        }}
      />
    </>
  );
};

export default StudentFormModal;
