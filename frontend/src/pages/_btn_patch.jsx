      {/* ── 하단 버튼 ── */}
      <div className="flex gap-3">
        {!isContentStep && (
          <button onClick={() => navigate('/coach/dashboard')}
            className="flex-1 py-3 bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-[#2a2d3e] text-gray-600 dark:text-slate-300
                       text-sm font-semibold rounded-xl hover:border-brand-400 transition-colors">
            취소
          </button>
        )}

        {isContentStep ? (
          <button onClick={handleFinish}
            disabled={contents.length === 0}
            className={`w-full py-3 text-white text-sm font-semibold rounded-xl transition-colors
              ${contents.length === 0
                ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
                : 'bg-brand-500 hover:bg-brand-600'}`}>
            {contents.length === 0 ? '⚠️ 자료를 최소 1개 추가해주세요' : `✅ 등록 완료 (자료 ${contents.length}개)`}
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 py-3 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300 text-white text-sm font-semibold rounded-xl transition-colors">
            {saving ? '저장 중...' : (isEditMode ? '수정 완료' : '다음 단계 →')}
          </button>
        )}
      </div>