import React, { useState, useEffect } from 'react';
import universityService from '../../services/universityService';
import userService from '../../services/userService';
import teacherService from '../../services/teacherService';
import { Department, Teacher } from '../../types';

interface TeacherFormModalProps {
    onClose: () => void;
    onSuccess: () => void;
    teacher?: Teacher | null; // For edit mode
}

const TeacherFormModal: React.FC<TeacherFormModalProps> = ({ onClose, onSuccess, teacher }) => {
    const isEditMode = !!teacher;
    const [step, setStep] = useState(isEditMode ? 2 : 1);
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
            setTeacherData({
                department: teacher.department?.toString() || '',
                rank: teacher.rank || 'ASSISTANT',
                contract_type: teacher.contract_type || 'PERMANENT',
                hire_date: teacher.hire_date || new Date().toISOString().split('T')[0],
                specialization: teacher.specialization || '',
                office_location: teacher.office_location || '',
                is_active: teacher.is_active ?? true
            });
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
        if (!userData.first_name || !userData.last_name || !userData.email || !userData.username || !userData.date_of_birth) {
            setError('Veuillez remplir tous les champs obligatoires');
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
                // Update existing teacher
                await teacherService.updateTeacher(teacher.id, {
                    ...teacherData,
                    department: teacherData.department ? parseInt(teacherData.department) : null,
                } as any);
            } else {
                // Create new teacher
                const birthYear = userData.date_of_birth ? new Date(userData.date_of_birth).getFullYear() : new Date().getFullYear();
                const generatedPassword = `${userData.first_name}${userData.last_name}@${birthYear}`.replace(/\s/g, '');

                const userResponse = await userService.createUser({
                    ...userData,
                    password: generatedPassword,
                    password_confirm: generatedPassword
                });

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
            setError(err.response?.data?.detail || err.response?.data?.error || JSON.stringify(err.response?.data) || 'Erreur lors de la sauvegarde');
        } finally {
            setLoading(false);
        }
    };

    const renderStep1 = () => (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Informations Utilisateur</h3>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                    <input
                        type="text"
                        name="first_name"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                        value={userData.first_name}
                        onChange={handleUserChange}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                    type="email"
                    name="email"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                    value={userData.email}
                    onChange={handleUserChange}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom d'utilisateur *</label>
                <input
                    type="text"
                    name="username"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                    value={userData.username}
                    onChange={handleUserChange}
                />
            </div>
            <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg text-sm">
                <span className="font-semibold">Note:</span> Le mot de passe sera généré automatiquement (PrénomNom@Année). L'utilisateur pourra le modifier ultérieurement.
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance *</label>
                    <input
                        type="date"
                        name="date_of_birth"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                        value={userData.date_of_birth}
                        onChange={handleUserChange}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sexe</label>
                    <select
                        name="gender"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                        value={userData.gender}
                        onChange={handleUserChange}
                    >
                        <option value="M">Homme</option>
                        <option value="F">Femme</option>
                    </select>
                </div>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                {isEditMode ? 'Modifier les informations professionnelles' : 'Informations Professionnelles'}
            </h3>
            {!isEditMode && (
                <div className="p-4 bg-blue-50 text-blue-700 rounded-lg text-sm">
                    <span className="font-semibold">Note:</span> Le matricule enseignant sera généré automatiquement.
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Département</label>
                    <select
                        name="department"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                        value={teacherData.department}
                        onChange={handleTeacherChange}
                    >
                        <option value="">Sélectionner</option>
                        {departments.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
                    <select
                        name="rank"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                        value={teacherData.rank}
                        onChange={handleTeacherChange}
                    >
                        <option value="ASSISTANT">Assistant</option>
                        <option value="LECTURER">Maître assistant</option>
                        <option value="SENIOR_LECTURER">Maître de conférences</option>
                        <option value="ASSOCIATE_PROFESSOR">Professeur associé</option>
                        <option value="PROFESSOR">Professeur</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type de contrat</label>
                    <select
                        name="contract_type"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                        value={teacherData.contract_type}
                        onChange={handleTeacherChange}
                    >
                        <option value="PERMANENT">Permanent</option>
                        <option value="CONTRACT">Contractuel</option>
                        <option value="VISITING">Vacataire</option>
                        <option value="PART_TIME">Temps partiel</option>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Spécialisation</label>
                <input
                    type="text"
                    name="specialization"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                    value={teacherData.specialization}
                    onChange={handleTeacherChange}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bureau</label>
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
                        Enseignant actif
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
                        {isEditMode ? 'Modifier l\'Enseignant' : 'Nouvel Enseignant'}
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

                    {/* Step indicator (only show for new teachers) */}
                    {!isEditMode && (
                        <div className="mb-6 flex items-center justify-center">
                            <div className={`w-3 h-3 rounded-full ${step >= 1 ? 'bg-teal-600' : 'bg-gray-300'}`}></div>
                            <div className={`w-12 h-1 ${step >= 2 ? 'bg-teal-600' : 'bg-gray-200'}`}></div>
                            <div className={`w-3 h-3 rounded-full ${step >= 2 ? 'bg-teal-600' : 'bg-gray-300'}`}></div>
                        </div>
                    )}

                    {/* NO FORM ELEMENT - This prevents accidental submission */}
                    <div>
                        {step === 1 && !isEditMode ? renderStep1() : renderStep2()}
                    </div>

                    {/* Navigation Buttons - All are type="button", no form submission */}
                    <div className="mt-8 flex justify-between">
                        {step === 2 && !isEditMode && (
                            <button
                                type="button"
                                onClick={goToPreviousStep}
                                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                            >
                                Précédent
                            </button>
                        )}
                        {step === 1 && !isEditMode ? (
                            <button
                                type="button"
                                onClick={goToNextStep}
                                className="ml-auto px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
                                disabled={!userData.first_name || !userData.last_name || !userData.email || !userData.username}
                            >
                                Suivant
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleFinalSubmit}
                                disabled={loading}
                                className="ml-auto px-6 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-lg hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
                            >
                                {loading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>}
                                {isEditMode ? 'Enregistrer les modifications' : 'Créer l\'enseignant'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeacherFormModal;
