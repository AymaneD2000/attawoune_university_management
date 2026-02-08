import React, { useState, useEffect } from 'react';
import universityService from '../../services/universityService';
import userService from '../../services/userService';
import studentService from '../../services/studentService';
import { Program, Level, Student, User } from '../../types';

interface StudentFormModalProps {
    onClose: () => void;
    onSuccess: () => void;
    student?: Student | null;
}

const StudentFormModal: React.FC<StudentFormModalProps> = ({ onClose, onSuccess, student }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [userData, setUserData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        username: '',
        role: 'STUDENT' as const,
        phone: '',
        address: '',
        date_of_birth: '',
        gender: 'M'
    });

    const [studentData, setStudentData] = useState({
        program: student?.program ? String(student.program) : '',
        current_level: student?.current_level ? String(student.current_level) : '',
        enrollment_date: student?.enrollment_date || new Date().toISOString().split('T')[0],
        status: student?.status || 'ACTIVE',
        guardian_name: student?.guardian_name || '',
        guardian_phone: student?.guardian_phone || '',
        emergency_contact: student?.emergency_contact || ''
    });

    const [photo, setPhoto] = useState<File | null>(null);

    // Options
    const [programs, setPrograms] = useState<Program[]>([]);
    const [levels, setLevels] = useState<Level[]>([]);

    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const [programsRes, levelsRes] = await Promise.all([
                    universityService.getPrograms({ page_size: 100 }),
                    universityService.getLevels({ page_size: 100 })
                ]);
                setPrograms(programsRes.results);
                setLevels(levelsRes.results);
            } catch (err) {
                console.error('Error fetching options:', err);
            }
        };
        fetchOptions();
    }, []);

    useEffect(() => {
        if (student) {
            const populateForm = async () => {
                try {
                    // Check if student.user is an ID or object (handling potential type mismatch from API)
                    const userId = typeof student.user === 'object' ? (student.user as any).id : student.user;

                    let user: User | null = null;
                    if (userId) {
                        // If we already have the user object in student (if serializer nested it), use it.
                        if (typeof student.user === 'object' && (student.user as any).email) {
                            user = student.user as any;
                        } else {
                            user = await userService.getUser(userId);
                        }
                    }

                    if (user) {
                        setUserData({
                            first_name: user.first_name || '',
                            last_name: user.last_name || '',
                            email: user.email || '',
                            username: user.username || '',
                            role: 'STUDENT' as const,
                            phone: user.phone || '',
                            address: user.address || '',
                            date_of_birth: user.date_of_birth || '',
                            gender: 'M' // Default
                        });
                    }

                    setStudentData({
                        program: student.program ? String(student.program) : '',
                        current_level: student.current_level ? String(student.current_level) : '',
                        enrollment_date: student.enrollment_date || new Date().toISOString().split('T')[0],
                        status: student.status || 'ACTIVE',
                        guardian_name: student.guardian_name || '',
                        guardian_phone: student.guardian_phone || '',
                        emergency_contact: student.emergency_contact || ''
                    });

                } catch (error) {
                    console.error("Failed to populate form:", error);
                }
            };
            populateForm();
        }
    }, [student]);

    const handleUserChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setUserData({ ...userData, [e.target.name]: e.target.value });
    };

    const handleStudentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setStudentData({ ...studentData, [e.target.name]: e.target.value });
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
            let userId = student?.user;

            if (!student) {
                // Create User if not editing
                const birthYear = userData.date_of_birth ? new Date(userData.date_of_birth).getFullYear() : new Date().getFullYear();
                const generatedPassword = `${userData.first_name}${userData.last_name}@${birthYear}`.replace(/\s/g, '');

                const userResponse = await userService.createUser({
                    ...userData,
                    password: generatedPassword,
                    password_confirm: generatedPassword
                });
                userId = userResponse.id;
            } else {
                // Update User if editing (optional, usually user details are separate but basic info can be here)
                // For now we skip specific user update endpoint call here to keep it simple or we can call it if needed.
                // Assuming we might want to update basic info.
                // HOWEVER, usually creating student implies creating user.
                // Let's assume for update we focus on student fields mostly, but maybe we can update user info too?
                // Let's try to update user info first if editing.
                if (userId) {
                    await userService.updateUser(userId, userData);
                }
            }

            // Create/Update Student
            const studentPayload = new FormData();
            if (!student) {
                studentPayload.append('user', String(userId));
            }
            studentPayload.append('program', studentData.program);
            studentPayload.append('current_level', studentData.current_level);
            // Default status to ACTIVE but make sure it uses the enum value
            studentPayload.append('status', String(studentData.status || 'ACTIVE'));
            studentPayload.append('enrollment_date', studentData.enrollment_date);
            if (studentData.guardian_name) studentPayload.append('guardian_name', studentData.guardian_name);
            if (studentData.guardian_phone) studentPayload.append('guardian_phone', studentData.guardian_phone);
            if (studentData.emergency_contact) studentPayload.append('emergency_contact', studentData.emergency_contact);

            if (photo) {
                studentPayload.append('photo', photo);
            }

            if (student) {
                await studentService.updateStudent(student.id, studentPayload);
            } else {
                await studentService.createStudent(studentPayload);
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Error saving student:', err);
            const errorData = err.response?.data;
            const errorMessage = typeof errorData === 'string'
                ? errorData
                : errorData?.message || errorData?.detail || errorData?.error || 'Erreur lors de la sauvegarde';

            setError(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));

            if (errorData && typeof errorData === 'object') {
                if (errorData.username) setError(`Nom d'utilisateur: ${errorData.username}`);
                if (errorData.email) setError(`Email: ${errorData.email}`);
                if (errorData.student_id) setError(`Matricule: ${errorData.student_id}`);
            }
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
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                        value={userData.first_name}
                        onChange={handleUserChange}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                    <input
                        type="text"
                        name="last_name"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
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
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    value={userData.email}
                    onChange={handleUserChange}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom d'utilisateur *</label>
                <input
                    type="text"
                    name="username"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    value={userData.username}
                    onChange={handleUserChange}
                />
            </div>
            <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg text-sm">
                <span className="font-semibold">Note:</span> {student ? "La modification du mot de passe doit se faire via l'administration des utilisateurs." : "Le mot de passe sera généré automatiquement (PrénomNom@Année)."}
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance *</label>
                    <input
                        type="date"
                        name="date_of_birth"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                        value={userData.date_of_birth}
                        onChange={handleUserChange}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sexe</label>
                    <select
                        name="gender"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                        value={userData.gender}
                        onChange={handleUserChange}
                    >
                        <option value="M">Homme</option>
                        <option value="F">Femme</option>
                    </select>
                </div>
            </div>
            <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Photo de profil</label>
                <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                            setPhoto(e.target.files[0]);
                        }
                    }}
                    className="w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-indigo-50 file:text-indigo-700
                        hover:file:bg-indigo-100"
                />
            </div>
        </div >
    );

    const renderStep2 = () => (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Informations Académiques</h3>
            <div className="p-4 bg-blue-50 text-blue-700 rounded-lg text-sm">
                <span className="font-semibold">Note:</span> Le matricule sera généré automatiquement (ex: FST1920MA007817).
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Programme *</label>
                    <select
                        name="program"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                        value={studentData.program}
                        onChange={handleStudentChange}
                    >
                        <option value="">Sélectionner</option>
                        {programs.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Niveau *</label>
                    <select
                        name="current_level"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                        value={studentData.current_level}
                        onChange={handleStudentChange}
                        disabled={!studentData.program}
                    >
                        <option value="">Sélectionner</option>
                        {levels
                            .filter(l => {
                                if (!studentData.program) return false;
                                const selectedProg = programs.find(p => p.id === parseInt(studentData.program));
                                return selectedProg?.levels.includes(l.id);
                            })
                            .map(l => (
                                <option key={l.id} value={l.id}>{l.display_name}</option>
                            ))
                        }
                    </select>
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date d'inscription</label>
                <input
                    type="date"
                    name="enrollment_date"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    value={studentData.enrollment_date}
                    onChange={handleStudentChange}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom du tuteur</label>
                <input
                    type="text"
                    name="guardian_name"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    value={studentData.guardian_name}
                    onChange={handleStudentChange}
                />
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white flex justify-between items-center">
                    <h2 className="text-xl font-bold">{student ? 'Modifier Étudiant' : 'Nouvel Étudiant'}</h2>
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
                        <div className={`w-3 h-3 rounded-full ${step >= 1 ? 'bg-indigo-600' : 'bg-gray-300'}`}></div>
                        <div className={`w-12 h-1 ${step >= 2 ? 'bg-indigo-600' : 'bg-gray-200'}`}></div>
                        <div className={`w-3 h-3 rounded-full ${step >= 2 ? 'bg-indigo-600' : 'bg-gray-300'}`}></div>
                    </div>

                    {/* NO FORM ELEMENT - Prevents accidental submission */}
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
                                Précédent
                            </button>
                        )}
                        {step === 1 ? (
                            <button
                                type="button"
                                onClick={goToNextStep}
                                className="ml-auto px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                                disabled={!userData.first_name || !userData.last_name || !userData.email || !userData.username}
                            >
                                Suivant
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleFinalSubmit}
                                disabled={loading}
                                className="ml-auto px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
                            >
                                {loading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>}
                                {student ? 'Enregistrer' : 'Créer l\'étudiant'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentFormModal;
