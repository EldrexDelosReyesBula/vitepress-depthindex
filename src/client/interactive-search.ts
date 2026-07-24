export class InteractiveSearch {
  /**
   * "Explain This" — Contextual floating widget.
   * User highlights text and presses Ctrl/Cmd + Shift + K.
   */
  initExplainThisWidget(): void {
    if (typeof document === 'undefined') return;

    // Create floating widget (hidden by default)
    const widget = document.createElement('div');
    widget.className = 'di-explain-widget';
    widget.innerHTML = `
      <div class="di-explain-content"></div>
      <div class="di-explain-actions">
        <button class="di-btn-sm">Ask about this</button>
        <button class="di-btn-sm di-btn-ghost">Close</button>
      </div>
    `;
    widget.style.display = 'none';
    document.body.appendChild(widget);

    // Listen for keyboard shortcut
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'K') {
        e.preventDefault();
        this.showExplainWidget(widget);
      }

      if (e.key === 'Escape') {
        widget.style.display = 'none';
      }
    });

    // Listen for text selection
    document.addEventListener('mouseup', () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim().length > 10) {
        this.showSelectionHint(selection);
      }
    });
  }

  private showExplainWidget(widget: HTMLElement): void {
    if (typeof window === 'undefined') return;
    const selection = window.getSelection();
    if (!selection || selection.toString().trim().length < 5) {
      window.dispatchEvent(new CustomEvent('depthindex:open-panel'));
      return;
    }

    const selectedText = selection.toString().trim();
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    widget.style.top = `${rect.bottom + window.scrollY + 10}px`;
    widget.style.left = `${rect.left + window.scrollX}px`;
    widget.style.display = 'block';

    const contentEl = widget.querySelector('.di-explain-content');
    if (contentEl) {
      contentEl.innerHTML = `
        <div class="di-explain-selected">"${selectedText.substring(0, 100)}${selectedText.length > 100 ? '...' : ''}"</div>
      `;
    }

    const askBtn = widget.querySelector('.di-btn-sm');
    if (askBtn) {
      askBtn.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('depthindex:open-panel', {
          detail: { query: `Explain this: ${selectedText}` },
        }));
        widget.style.display = 'none';
      });
    }

    const closeBtn = widget.querySelector('.di-btn-ghost');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        widget.style.display = 'none';
      });
    }
  }

  private showSelectionHint(selection: Selection): void {
    if (typeof document === 'undefined') return;
    document.querySelector('.di-selection-hint')?.remove();

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    const hint = document.createElement('div');
    hint.className = 'di-selection-hint';
    const isMac = typeof navigator !== 'undefined' && navigator.platform?.includes('Mac');
    hint.innerHTML = `<kbd>${isMac ? '⌘' : 'Ctrl'}+Shift+K</kbd> to ask about this`;
    hint.style.position = 'absolute';
    hint.style.top = `${rect.top + (typeof window !== 'undefined' ? window.scrollY : 0) - 30}px`;
    hint.style.left = `${rect.left + (typeof window !== 'undefined' ? window.scrollX : 0)}px`;

    document.body.appendChild(hint);

    setTimeout(() => hint.remove(), 3000);
  }

  /**
   * Code Playground — Execute and edit code snippets.
   */
  enhanceCodeBlocks(): void {
    if (typeof document === 'undefined') return;
    document.querySelectorAll('.di-code-block').forEach(block => {
      if (block.querySelector('.di-code-playground')) return;

      const lang = block.querySelector('.di-code-lang')?.textContent?.toLowerCase() || '';
      const isRunnable = ['javascript', 'js', 'typescript', 'ts'].includes(lang);

      if (!isRunnable) return;

      const actions = document.createElement('div');
      actions.className = 'di-code-actions di-code-playground';
      actions.innerHTML = `
        <button class="di-code-run" title="Run code">
          <i class="fa-solid fa-play"></i> Run
        </button>
        <button class="di-code-edit" title="Edit code">
          <i class="fa-solid fa-pen-to-square"></i> Edit
        </button>
      `;

      block.querySelector('.di-code-header')?.appendChild(actions);

      const runBtn = actions.querySelector('.di-code-run');
      if (runBtn) {
        runBtn.addEventListener('click', () => {
          const code = block.querySelector('code')?.textContent || '';
          this.executeCode(code);
        });
      }

      const editBtn = actions.querySelector('.di-code-edit');
      if (editBtn) {
        editBtn.addEventListener('click', () => {
          this.toggleCodeEditor(block as HTMLElement);
        });
      }
    });
  }

  executeCode(code: string): string {
    try {
      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: any[]) => {
        logs.push(args.map(String).join(' '));
      };

      const result = new Function(code)();

      console.log = originalLog;

      const output = logs.length > 0
        ? logs.join('\n')
        : String(result !== undefined ? result : 'Code executed (no output)');

      this.showCodeOutput(output);
      return output;
    } catch (error: any) {
      const errStr = `Error: ${error.message}`;
      this.showCodeOutput(errStr);
      return errStr;
    }
  }

  private showCodeOutput(output: string): void {
    if (typeof document === 'undefined') return;
    const existing = document.querySelector('.di-code-output');
    if (existing) existing.remove();

    const outputEl = document.createElement('div');
    outputEl.className = 'di-code-output';
    outputEl.innerHTML = `
      <div class="di-code-output-header">Output</div>
      <pre><code>${output}</code></pre>
    `;

    document.querySelector('.di-code-block')?.after(outputEl);
  }

  private toggleCodeEditor(block: HTMLElement): void {
    const pre = block.querySelector('pre');
    const code = block.querySelector('code');
    if (!pre || !code) return;

    const isEditing = pre.hasAttribute('contenteditable');

    if (isEditing) {
      pre.removeAttribute('contenteditable');
      block.querySelector('.di-code-edit i')?.classList.replace('fa-check', 'fa-pen-to-square');
    } else {
      pre.setAttribute('contenteditable', 'true');
      pre.focus();
      block.querySelector('.di-code-edit i')?.classList.replace('fa-pen-to-square', 'fa-check');
    }
  }
}
