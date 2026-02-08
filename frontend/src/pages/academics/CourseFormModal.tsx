import React, { useState, useEffect } from 'react';
import { Course, Program, Level } from '../../types';
import api from '../../services/api';

interface CourseFormModalProps {
    course: Course | null;
    programs: Program[];
    levels: Level[];
    onClose: () => void;
    onSuccess: () => void;
}

const CourseFormModal: React.FC<CourseFormModalProps> = ({ course, programs, levels, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        program: '',
        level: '',
        semester_type: 'S1',
        course_type: 'REQUIRED',
        credits: 3,
        coefficient: 1.0,
        hours_lecture: 30,
        hours_tutorial: 0,
        hours_practical: 0,
        description: '',
        is_active: true
    });
    const [programLevels, setProgramLevels] = useState<Level[]>([]);

    useEffect(() => {
        if (course) {
            setFormData({
                code: course.code,
                name: course.name,
                program: course.program.toString(),
                level: course.level.toString(),
                semester_type: course.semester_type || 'S1',
                course_type: course.course_type,
                credits: course.credits,
                coefficient: parseFloat(course.coefficient),
                hours_lecture: course.hours_lecture,
                hours_tutorial: course.hours_tutorial,
                hours_practical: course.hours_practical,
                description: course.description,
                is_active: course.is_active
            });
        }
    }, [course]);

    // Update available levels when program changes
    useEffect(() => {
        if (formData.program) {
            const selectedProgram = programs.find(p => p.id === parseInt(formData.program));
            if (selectedProgram) {
                // Filter levels that are in the program's level IDs
                const availableLevels = levels.filter(l => selectedProgram.levels.includes(l.id));
                setProgramLevels(availableLevels);
            } else {
                setProgramLevels([]);
            }
        } else {
            setProgramLevels([]);
        }
    }, [formData.program, programs, levels]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (course) {
                await api.put(`/academics/courses/${course.id}/`, formData);
            } else {
                await api.post('/academics/courses/', formData);
            }
            onSuccess();
        } catch (error) {
            console.error('Error saving course:', error);
            alert('Une erreur est survenue lors de l\'enregistrement.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">
                        {course ? 'Modifier le cours' : 'Nouveau Cours'}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Code du cours</label>
                            <input
                                name="code"
                                type="text"
                                required
                                value={formData.code}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                                placeholder="ex: INF101"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nom du cours</label>
                            <input
                                name="name"
                                type="text"
                                required
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Programme</label>
                            <select
                                name="program"
                                required
                                value={formData.program}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="">Sélectionner...</option>
                                {programs.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Niveau</label>
                            <select
                                name="level"
                                required
                                value={formData.level}
                                onChange={handleChange}
                                disabled={!formData.program}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="">Select. prog d'abord</option>
                                {programLevels.map(l => (
                                    <option key={l.id} value={l.id}>{l.display_name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Semestre</label>
                            <select
                                name="semester_type"
                                required
                                value={formData.semester_type}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="S1">Semestre 1</option>
                                <option value="S2">Semestre 2</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Type de cours</label>
                            <select
                                name="course_type"
                                required
                                value={formData.course_type}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="REQUIRED">Obligatoire</option>
                                <option value="ELECTIVE">Optionnel</option>
                                <option value="PRACTICAL">Travaux pratiques</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Crédits</label>
                            <input
                                name="credits"
                                type="number"
                                min="0"
                                value={formData.credits}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Coefficient</label>
                            <input
                                name="coefficient"
                                type="number"
                                step="0.1"
                                min="0"
                                value={formData.coefficient}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Heures CM</label>
                            <input
                                name="hours_lecture"
                                type="number"
                                min="0"
                                value={formData.hours_lecture}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Heures TD</label>
                            <input
                                name="hours_tutorial"
                                type="number"
                                min="0"
                                value={formData.hours_tutorial}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Heures TP</label>
                            <input
                                name="hours_practical"
                                type="number"
                                min="0"
                                value={formData.hours_practical}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            name="description"
                            rows={3}
                            value={formData.description}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                        ></textarea>
                    </div>
                    <div className="flex justify-end space-x-3 mt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                            Annuler
                        </button>
                        <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                            {course ? 'Mettre à jour' : 'Créer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CourseFormModal;
