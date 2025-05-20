import React from 'react';
import { FiFile, FiX } from 'react-icons/fi';
import styles from './Taxation.module.css';

const DocumentList = ({ documents, onRemove, onDocumentClick }) => {
    const formatFileSize = (bytes) => {
        if (!bytes) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className={styles.documentList}>
            {documents?.map((doc) => (
                <div key={doc.id} className={styles.documentItem}>
                    <div 
                        className={styles.documentContent}
                        onClick={() => onDocumentClick(doc)}
                        role="button"
                        tabIndex={0}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                onDocumentClick(doc);
                            }
                        }}
                    >
                        <div className={styles.documentIcon}>
                            <FiFile className={styles.fileIcon} size={24} />
                        </div>
                        <div className={styles.documentInfo}>
                            <div className={styles.documentName}>
                                {doc.filename}
                            </div>
                            <div className={styles.documentMeta}>
                                {doc.file_size && <span>{formatFileSize(doc.file_size)}</span>}
                                {doc.uploaded_at && (
                                    <>
                                        <span className={styles.separator}>•</span>
                                        <span>{formatDate(doc.uploaded_at)}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    <button 
                        type="button"
                        className={styles.removeButton}
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove(doc.id);
                        }}
                        aria-label="Remove document"
                    >
                        <FiX size={20} />
                    </button>
                </div>
            ))}
        </div>
    );
};

export default DocumentList;