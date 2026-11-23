import { useState } from 'react';
import { api } from '../api.js';

export default function CreateTopicModal({ isOpen, onClose, onTopicCreated }) {
  const [formData, setFormData] = useState({
    title: '',
    grade: 4,
    subject: 'Mathematics',
    learning_objectives: '',
    reference_material: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Please enter a topic name');
      return;
    }

    setLoading(true);
    try {
      const objectives = formData.learning_objectives
        .split('\n')
        .map(obj => obj.trim())
        .filter(obj => obj.length > 0);

      if (objectives.length === 0) {
        setError('Please add at least one learning objective');
        setLoading(false);
        return;
      }

      const topicData = {
        grade: parseInt(formData.grade),
        subject: formData.subject,
        title: formData.title.trim(),
        learning_objectives: objectives,
        reference_material: formData.reference_material || null
      };

      const topic = await api.createTopic(topicData);
      onTopicCreated(topic);
      resetForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      grade: 4,
      subject: 'Mathematics',
      learning_objectives: '',
      reference_material: ''
    });
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '30px',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
      }}>
        <h2 style={{ color: '#153e67', fontSize: '22px', margin: '0 0 20px', fontWeight: '900' }}>
          Create a New Topic
        </h2>

        {error && (
          <div style={{ background: '#ffe0e0', color: '#c00', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
          {/* Topic Name */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: '900', color: '#153e67' }}>
              Topic Name *
            </label>
            <input
              type="text"
              placeholder="e.g., Fractions & Decimals"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              style={{
                width: '100%',
                border: '1px solid #d8e5e9',
                borderRadius: '11px',
                padding: '11px 12px',
                background: '#fff',
                color: '#23425e',
                fontSize: '14px',
                fontFamily: 'inherit',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Grade & Subject Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: '900', color: '#153e67' }}>
                Grade *
              </label>
              <select
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                style={{
                  width: '100%',
                  border: '1px solid #d8e5e9',
                  borderRadius: '11px',
                  padding: '11px 12px',
                  background: '#fff',
                  color: '#23425e',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box'
                }}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(g => (
                  <option key={g} value={g}>Grade {g}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: '900', color: '#153e67' }}>
                Subject *
              </label>
              <select
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                style={{
                  width: '100%',
                  border: '1px solid #d8e5e9',
                  borderRadius: '11px',
                  padding: '11px 12px',
                  background: '#fff',
                  color: '#23425e',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box'
                }}
              >
                <option>Mathematics</option>
                <option>Science</option>
                <option>English</option>
                <option>History</option>
                <option>Geography</option>
              </select>
            </div>
          </div>

          {/* Learning Objectives */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: '900', color: '#153e67' }}>
              Learning Objectives * (one per line)
            </label>
            <textarea
              placeholder="e.g., Understand fractions as parts of a whole&#10;Add and subtract fractions with like denominators"
              value={formData.learning_objectives}
              onChange={(e) => setFormData({ ...formData, learning_objectives: e.target.value })}
              style={{
                width: '100%',
                border: '1px solid #d8e5e9',
                borderRadius: '11px',
                padding: '11px 12px',
                background: '#fff',
                color: '#23425e',
                fontSize: '14px',
                boxSizing: 'border-box',
                minHeight: '100px',
                fontFamily: 'monospace'
              }}
            />
            <small style={{ fontSize: '11px', color: '#688097', marginTop: '4px', display: 'block' }}>
              Enter each objective on a new line. These guide AI question generation.
            </small>
          </div>

          {/* Reference Material */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: '900', color: '#153e67' }}>
              Reference Material (optional)
            </label>
            <textarea
              placeholder="Paste teaching notes, key concepts, or reference materials here. This helps the AI generate better questions."
              value={formData.reference_material}
              onChange={(e) => setFormData({ ...formData, reference_material: e.target.value })}
              style={{
                width: '100%',
                border: '1px solid #d8e5e9',
                borderRadius: '11px',
                padding: '11px 12px',
                background: '#fff',
                color: '#23425e',
                fontSize: '14px',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                minHeight: '80px'
              }}
            />
            <small style={{ fontSize: '11px', color: '#688097', marginTop: '4px', display: 'block' }}>
              Add any background info or curriculum materials to improve question quality.
            </small>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '20px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={resetForm}
              disabled={loading}
              style={{
                background: 'white',
                color: '#153e67',
                border: '1px solid #dce8ed',
                padding: '11px 17px',
                borderRadius: '999px',
                fontWeight: '900',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                background: loading ? '#ccc' : 'linear-gradient(100deg, #19b7a7, #079c98)',
                color: 'white',
                padding: '11px 17px',
                borderRadius: '999px',
                fontWeight: '900',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px'
              }}
            >
              {loading ? 'Creating...' : '✨ Create Topic'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
