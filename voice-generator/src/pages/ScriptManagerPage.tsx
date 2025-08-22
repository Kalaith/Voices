import React, { useState } from 'react';
import { useScripts } from '../hooks/useScripts';
import { useVoices } from '../hooks/useVoices';
import { Script } from '../types/script';
import { EnhancedScriptEditor } from '../components/EnhancedScriptEditor';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Breadcrumb, BreadcrumbItem } from '../components/ui/Breadcrumb';

export function ScriptManagerPage() {
  const { scripts, loading, error, createScript, deleteScript, updateScript } = useScripts();
  const { voices } = useVoices();
  const [editingScript, setEditingScript] = useState<Script | null>(null);
  const [view, setView] = useState<'list' | 'edit'>('list');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{script: Script} | null>(null);

  const handleCreateScript = async () => {
    const newScript = await createScript();
    if (newScript) {
      setEditingScript(newScript);
      setView('edit');
    }
  };

  const handleEditScript = (script: Script) => {
    setEditingScript(script);
    setView('edit');
  };

  const handleScriptUpdated = (updatedScript: Script) => {
    // Update local state immediately (no backend call)
    setEditingScript(updatedScript);
    setHasUnsavedChanges(true);
  };

  const handleSaveScript = async () => {
    if (editingScript && hasUnsavedChanges) {
      await updateScript(editingScript.id, editingScript);
      setHasUnsavedChanges(false);
    }
  };

  const handleBackToList = async () => {
    // Save changes before going back if there are any
    if (hasUnsavedChanges) {
      await handleSaveScript();
    }
    setView('list');
    setEditingScript(null);
    setHasUnsavedChanges(false);
  };

  const handleDeleteScript = (script: Script) => {
    setDeleteConfirm({ script });
  };

  const confirmDelete = async () => {
    if (deleteConfirm) {
      await deleteScript(deleteConfirm.script.id);
      setDeleteConfirm(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <div className="w-full max-w-md">
          <ProgressBar
            progress={0}
            label="Loading scripts..."
            indeterminate
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      {view === 'edit' && editingScript && (
        <Breadcrumb
          items={[
            { label: 'Scripts', onClick: handleBackToList },
            { label: editingScript.name, current: true }
          ] as BreadcrumbItem[]}
          className="mb-4"
        />
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              {view === 'edit' ? `Editing: ${editingScript?.name}` : 'Script Manager'}
              {hasUnsavedChanges && (
                <span className="text-sm px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full flex items-center gap-1" role="status" aria-label="Unsaved changes">
                  <span>⚠️</span>
                  Unsaved changes
                </span>
              )}
            </h2>
            <p className="text-gray-600">
              {view === 'edit' 
                ? 'Edit your script with speakers and dialogue lines. Changes are auto-saved when you navigate back.'
                : `Create and manage your multi-speaker scripts (${scripts.length} scripts)`
              }
            </p>
          </div>
        <div className="flex gap-2">
          {view === 'edit' && hasUnsavedChanges && (
            <Button
              variant="primary"
              onClick={handleSaveScript}
              className="flex items-center gap-2"
              ariaLabel="Save changes to script"
            >
              <span>💾</span>
              Save Changes
            </Button>
          )}
          {view === 'list' && (
            <Button
              variant="success"
              onClick={handleCreateScript}
              className="flex items-center gap-2"
              ariaLabel="Create a new script"
            >
              <span>➕</span>
              Create New Script
            </Button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-red-600">⚠️</span>
            <span className="ml-2 text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Content based on view */}
      {view === 'list' ? (
        /* Scripts List View */
        scripts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No scripts yet</h3>
            <p className="text-gray-600 mb-4">Create your first script to get started</p>
            <Button
              variant="success"
              onClick={handleCreateScript}
              ariaLabel="Create your first script"
            >
              Create Script
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scripts.map((script) => (
              <div key={script.id} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">{script.name}</h3>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditScript(script)}
                      ariaLabel={`Edit ${script.name} script`}
                      className="text-blue-500 hover:text-blue-700 p-1"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteScript(script)}
                      ariaLabel={`Delete ${script.name} script`}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </Button>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                    <span>👥 {script.speakers.length} speakers</span>
                    <span>•</span>
                    <span>📝 {script.lines.length} lines</span>
                  </div>
                  
                  {script.speakers.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {script.speakers.slice(0, 3).map((speaker) => (
                        <span
                          key={speaker.id}
                          className="inline-block px-2 py-1 text-xs rounded-full text-white"
                          style={{ backgroundColor: speaker.color }}
                        >
                          {speaker.name}
                        </span>
                      ))}
                      {script.speakers.length > 3 && (
                        <span className="inline-block px-2 py-1 text-xs rounded-full bg-gray-200 text-gray-600">
                          +{script.speakers.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => handleEditScript(script)}
                    className="flex-1"
                    ariaLabel={`Edit ${script.name} script`}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="px-4"
                    ariaLabel={`Export ${script.name} script`}
                    disabled
                  >
                    Export
                  </Button>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-400">
                    Created: {new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Seamless Script Editor View */
        editingScript && (
          <EnhancedScriptEditor
            script={editingScript}
            voices={voices}
            onScriptUpdate={handleScriptUpdated}
            onGenerateAudio={() => {}}
          />
        )
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={confirmDelete}
          title="Delete Script"
          message={`Are you sure you want to delete "${deleteConfirm.script.name}"? This will permanently delete all speakers and dialogue lines. This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
          icon="🗑️"
        />
      )}
    </div>
  );
}