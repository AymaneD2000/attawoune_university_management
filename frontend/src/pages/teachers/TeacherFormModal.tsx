import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import universityService from '../../services/universityService';
import userService from '../../services/userService';
import teacherService from '../../services/teacherService';
import { Department, Teacher } from '../../types';
import { normalizeApiError } from '../../utils/apiError';
import { changedFields, hasChangedFields } from '../../utils/partialUpdate';

interface TeacherFormModalProps {
    onClose: () => void;
    onSuccess: () => void;
    teacher?: Teacher | null; // For edit mode
}

const TeacherFormModal: React.FC<TeacherFormModalProps> = ({ onClose, onSuccess, teacher }) => {
    const { t } = useTranslation();
    const isEditMode = !!teacher;
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [userData, setUserData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        username: '',
        role: 'TEACHER',
        phone: '',
        address: '',
        date_of_birth: '',
        gender: 'M'
    });

    const [teacherData, setTeacherData] = useState({
        department: '',
        rank: 'ASSISTANT',
        contract_type: 'PERMANENT',
        hire_date: new Date().toISOString().split('T')[0],
        specialization: '',
        office_location: '',
        is_active: true
    });
    const initialUserDataRef = useRef(userData);
    const initialTeacherDataRef = useRef(teacherData);

    // Options
    const [departments, setDepartments] = useState<Department[]>([]);

    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const departmentsRes = await universityService.getDepartments({ page_size: 100 });
                setDepartments(departmentsRes.results);
            } catch (err) {
                console.error('Error fetching options:', err);
            }
        };
        fetchOptions();
    }, []);

    // Pre-fill data when editing
    useEffect(() => {
        if (teacher) {
            const populatedUserData = {
                first_name: teacher.first_name || '',
                last_name: teacher.last_name || '',
                email: teacher.user_email || '',
                username: '',
                role: 'TEACHER',
                phone: teacher.user_phone || '',
                address: teacher.user_address || '',
                date_of_birth: teacher.user_date_of_birth || '',
                gender: teacher.user_gender || 'M'
            };
            const populatedTeacherData = {
                department: teacher.department?.toString() || '',
                rank: teacher.rank || 'ASSISTANT',
                contract_type: teacher.contract_type || 'PERMANENT',
                hire_date: teacher.hire_date || new Date().toISOString().split('T')[0],
                specialization: teacher.specialization || '',
                office_location: teacher.office_location || '',
                is_active: teacher.is_active ?? true
            };
            setUserData(populatedUserData);
            setTeacherData(populatedTeacherData);
            initialUserDataRef.current = populatedUserData;
            initialTeacherDataRef.current = populatedTeacherData;
        }
    }, [teacher]);

    const handleUserChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setUserData({ ...userData, [e.target.name]: e.target.value });
    };

    const handleTeacherChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
        setTeacherData({ ...teacherData, [e.target.name]: value });
    };

    const validateStep1 = (): boolean => {
        if (!userData.first_name || !userData.last_name) {
            setError(t('teachers.form.errors.required_fields', 'Veuillez remplir tous les champs obligatoires'));
            return false;
        }
        setError(null);
        return true;
    };

    const goToNextStep = () => {
        if (validateStep1()) {
            setStep(2);
        }
    };

    const goToPreviousStep = () => {
        setStep(1);
    };

    const handleFinalSubmit = async () => {
        // This function is ONLY called from step 2
        setError(null);
        setLoading(true);

        try {
            if (isEditMode && teacher) {
                const teacherChanges: Record<string, any> = changedFields(
                    teacherData,
                    initialTeacherDataRef.current,
                );
                if ('department' in teacherChanges) {
                    teacherChanges.department = teacherData.department
                        ? parseInt(teacherData.department)
                        : null;
                }

                const userChanges = changedFields(
                    userData,
                    initialUserDataRef.current,
                );
                const userFieldMap: Record<string, string> = {
                    first_name: 'first_name',
                    last_name: 'last_name',
                    email: 'user_email',
                    phone: 'user_phone',
                    address: 'user_address',
                    date_of_birth: 'user_date_of_birth',
                    gender: 'user_gender',
                };
                Object.entries(userChanges).forEach(([field, value]) => {
                    const apiField = userFieldMap[field];
                    if (!apiField) return;
                    teacherChanges[apiField] = field === 'date_of_birth' && !value
                        ? null
                        : value;
                });

                if (hasChangedFields(teacherChanges)) {
                    await teacherService.updateTeacher(teacher.id, teacherChanges);
                }
            } else {
                // Create new teacher
                const randomNum = Math.floor(Math.random() * 900) + 100;
                const autoUsername = `ens_${userData.first_name.toLowerCase().replace(/\s/g, '_')}_${userData.last_name.toLowerCase().replace(/\s/g, '_')}_${randomNum}`;
                const birthYear = userData.date_of_birth ? new Date(userData.date_of_birth).getFullYear() : new Date().getFullYear();
                const generatedPassword = `${userData.first_name}${userData.last_name}@${birthYear}`.replace(/\s/g, '');

                const userPayload: any = {
                    ...userData,
                    username: autoUsername,
                    password: generatedPassword,
                    password_confirm: generatedPassword
                };

                if (!userPayload.email) delete userPayload.email;
                if (!userPayload.date_of_birth) delete userPayload.date_of_birth;
                if (!userPayload.phone) delete userPayload.phone;
                if (!userPayload.address) delete userPayload.address;

                const userResponse = await userService.createUser(userPayload);

                await teacherService.createTeacher({
                    ...teacherData,
                    user: userResponse.id,
                    department: teacherData.department ? parseInt(teacherData.department) : null,
                } as any);
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Error saving teacher:', err);
            setError(normalizeApiError(
                err.response?.data,
                t('teachers.form.errors.save_error', 'Erreur lors de la sauvegarde'),
            ).message);
        } finally {
            setLoading(false);
        }
    };

    const renderStep1 = () => (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">{t('teachers.form.sections.user_info', 'Informations Utilisateur')}</h3>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('teachers.form.labels.first_name', 'Prénom *')}</label>
                    <input
                        type="text"
                        name="first_name"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                        value={userData.first_name}
                        onChange={handleUserChange}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('teachers.form.labels.last_name', 'Nom *')}</label>
                    <input
                        type="text"
                        name="last_name"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                        value={userData.last_name}
                        onChange={handleUserChange}
                    />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('teachers.form.labels.email', 'Email')}</label>
                <input
                    type="email"
                    name="email"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                    value={userData.email}
                    onChange={handleUserChange}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('teachers.form.labels.phone', 'Téléphone')}</label>
                    <input
                        type="tel"
                        name="phone"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                        value={userData.phone}
                        onChange={handleUserChange}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('teachers.form.labels.address', 'Adresse')}</label>
                    <input
                        type="text"
                        name="address"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                        value={userData.address}
                        onChange={handleUserChange}
                    />
                </div>
            </div>

            <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg text-sm">
                <span className="font-semibold">Note:</span> {t('teachers.form.notes.password_auto', "Le mot de passe sera généré automatiquement (PrénomNom@Année). L'utilisateur pourra le modifier ultérieurement.")}
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('teachers.form.labels.date_of_birth', 'Date de naissance')}</label>
                    <input
                        type="date"
                        name="date_of_birth"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                        value={userData.date_of_birth}
                        onChange={handleUserChange}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('teachers.form.labels.gender', 'Sexe')}</label>
                    <select
                        name="gender"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                        value={userData.gender}
                        onChange={handleUserChange}
                    >
                        <option value="M">{t('teachers.form.options.male', 'Homme')}</option>
                        <option value="F">{t('teachers.form.options.female', 'Femme')}</option>
                    </select>
                </div>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                {isEditMode ? t('teachers.form.sections.edit_pro_info', 'Modifier les informations professionnelles') : t('teachers.form.sections.pro_info', 'Informations Professionnelles')}
            </h3>
            {!isEditMode && (
                <div className="p-4 bg-blue-50 text-blue-700 rounded-lg text-sm">
                    <span className="font-semibold">Note:</span> {t('teachers.form.notes.matricule_auto', 'Le matricule enseignant sera généré automatiquement.')}
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('teachers.form.labels.department', 'Département')}</label>
                    <select
                        name="department"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                        value={teacherData.department}
                        onChange={handleTeacherChange}
                    >
                        <option value="">{t('teachers.form.options.select', 'Sélectionner')}</option>
                        {departments.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('teachers.form.labels.rank', 'Grade')}</label>
                    <select
                        name="rank"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                        value={teacherData.rank}
                        onChange={handleTeacherChange}
                    >
                        <option value="ASSISTANT">{t('teachers.filters.assistant', 'Assistant')}</option>
                        <option value="LECTURER">{t('teachers.filters.lecturer', 'Maître assistant')}</option>
                        <option value="SENIOR_LECTURER">{t('teachers.filters.senior_lecturer', 'Maître de conférences')}</option>
                        <option value="ASSOCIATE_PROFESSOR">{t('teachers.filters.associate_professor', 'Professeur associé')}</option>
                        <option value="PROFESSOR">{t('teachers.filters.professor', 'Professeur')}</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('teachers.form.labels.contract_type', 'Type de contrat')}</label>
                    <select
                        name="contract_type"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                        value={teacherData.contract_type}
                        onChange={handleTeacherChange}
                    >
                        <option value="PERMANENT">{t('teachers.form.options.permanent', 'Permanent')}</option>
                        <option value="CONTRACT">{t('teachers.form.options.contract', 'Contractuel')}</option>
                        <option value="VISITING">{t('teachers.form.options.visiting', 'Vacataire')}</option>
                        <option value="PART_TIME">{t('teachers.form.options.part_time', 'Temps partiel')}</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date d'embauche</label>
                    <input
                        type="date"
                        name="hire_date"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                        value={teacherData.hire_date}
                        onChange={handleTeacherChange}
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('teachers.form.labels.specialization', 'Spécialisation')}</label>
                <input
                    type="text"
                    name="specialization"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                    value={teacherData.specialization}
                    onChange={handleTeacherChange}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('teachers.form.labels.office', 'Bureau')}</label>
                <input
                    type="text"
                    name="office_location"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                    value={teacherData.office_location}
                    onChange={handleTeacherChange}
                />
            </div>

            {isEditMode && (
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        name="is_active"
                        id="is_active"
                        checked={teacherData.is_active}
                        onChange={handleTeacherChange}
                        className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                    />
                    <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                        {t('teachers.form.labels.active_teacher', 'Enseignant actif')}
                    </label>
                </div>
            )}
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="bg-gradient-to-r from-teal-600 to-emerald-600 p-6 text-white flex justify-between items-center">
                    <h2 className="text-xl font-bold">
                        {isEditMode ? t('teachers.form.title_edit', "Modifier l'Enseignant") : t('teachers.form.title_new', 'Nouvel Enseignant')}
                    </h2>
                    <button onClick={onClose} className="text-white/80 hover:text-white">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div className="mb-6 flex items-center justify-center">
                        <div className={`w-3 h-3 rounded-full ${step >= 1 ? 'bg-teal-600' : 'bg-gray-300'}`}></div>
                        <div className={`w-12 h-1 ${step >= 2 ? 'bg-teal-600' : 'bg-gray-200'}`}></div>
                        <div className={`w-3 h-3 rounded-full ${step >= 2 ? 'bg-teal-600' : 'bg-gray-300'}`}></div>
                    </div>

                    {/* NO FORM ELEMENT - This prevents accidental submission */}
                    <div>
                        {step === 1 ? renderStep1() : renderStep2()}
                    </div>

                    {/* Navigation Buttons - All are type="button", no form submission */}
                    <div className="mt-8 flex justify-between">
                        {step === 2 && (
                            <button
                                type="button"
                                onClick={goToPreviousStep}
                                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                            >
                                {t('teachers.form.buttons.prev', 'Précédent')}
                            </button>
                        )}
                        {step === 1 ? (
                            <div className="ml-auto flex items-center gap-2">
                                {isEditMode && (
                                    <button
                                        type="button"
                                        onClick={handleFinalSubmit}
                                        disabled={loading || !userData.first_name || !userData.last_name}
                                        className="px-5 py-2 border border-teal-200 bg-teal-50 text-teal-700 font-bold rounded-lg hover:bg-teal-100 disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {loading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-teal-200 border-t-teal-700"></div>}
                                        {t('teachers.form.buttons.save', 'Enregistrer les modifications')}
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={goToNextStep}
                                    className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
                                    disabled={!userData.first_name || !userData.last_name}
                                >
                                    {t('teachers.form.buttons.next', 'Suivant')}
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={handleFinalSubmit}
                                disabled={loading}
                                className="ml-auto px-6 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-lg hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
                            >
                                {loading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>}
                                {isEditMode ? t('teachers.form.buttons.save', 'Enregistrer les modifications') : t('teachers.form.buttons.create', "Créer l'enseignant")}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeacherFormModal;
