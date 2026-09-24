(() => {
    'use strict';

    const STORAGE_KEY = 'polytechnic_records';
    const ATTENDANCE_LIMIT = 75;

    // Store frequently used elements in one place so the rest of the code is easy to read.
    const elements = {
        form: document.querySelector('#recordForm'),
        subjectsList: document.querySelector('#subjectsList'),
        addSubjectButton: document.querySelector('#addSubjectButton'),
        clearButton: document.querySelector('#clearButton'),
        saveButton: document.querySelector('#saveButton'),
        fullName: document.querySelector('#fullName'),
        rollNumber: document.querySelector('#rollNumber'),
        branch: document.querySelector('#branch'),
        semester: document.querySelector('#semester'),
        searchInput: document.querySelector('#searchInput'),
        recordsBody: document.querySelector('#recordsBody'),
        emptyState: document.querySelector('#emptyState'),
        recordCount: document.querySelector('#recordCount'),
        exportButton: document.querySelector('#exportButton'),
        totalStudents: document.querySelector('#totalStudents'),
        averagePercentage: document.querySelector('#averagePercentage'),
        attendanceCleared: document.querySelector('#attendanceCleared'),
        backlogCases: document.querySelector('#backlogCases'),
        previewTotal: document.querySelector('#previewTotal'),
        previewPercentage: document.querySelector('#previewPercentage'),
        previewAttendance: document.querySelector('#previewAttendance'),
        previewStatus: document.querySelector('#previewStatus'),
        toastRegion: document.querySelector('#toastRegion'),
        themeToggle: document.querySelector('#themeToggle'),
        marksheetModal: document.querySelector('#marksheetModal'),
        marksheetContent: document.querySelector('#marksheetContent'),
        closeModalButton: document.querySelector('#closeModalButton'),
        printButton: document.querySelector('#printButton')
    };

    const state = {
        records: loadRecords(),
        searchText: '',
        editingId: null
    };

    // Read JSON records from LocalStorage. Bad or missing data safely becomes an empty list.
    function loadRecords() {
        try {
            const savedData = localStorage.getItem(STORAGE_KEY);
            const parsedData = savedData ? JSON.parse(savedData) : [];
            return Array.isArray(parsedData) ? parsedData : [];
        } catch (error) {
            showToast('Saved records could not be loaded.', 'warning');
            return [];
        }
    }

    // Convert the records array to JSON and save the latest version on the device.
    function saveRecords() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.records));
    }

    function createId() {
        return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    }

    // Build the styled option panels while keeping the original selects as the form values.
    function setupCustomSelects() {
        document.querySelectorAll('.custom-select').forEach(wrapper => {
            const select = wrapper.querySelector('select');
            const trigger = wrapper.querySelector('.custom-select-trigger');
            const menu = wrapper.querySelector('.custom-select-menu');
            const triggerText = trigger.querySelector('span');

            [...select.options].forEach(option => {
                const optionButton = document.createElement('button');
                optionButton.className = 'custom-select-option';
                optionButton.type = 'button';
                optionButton.dataset.value = option.value;
                optionButton.setAttribute('role', 'option');
                optionButton.textContent = option.textContent;
                menu.append(optionButton);
            });

            function syncSelect() {
                const selectedOption = select.options[select.selectedIndex] || select.options[0];
                triggerText.textContent = selectedOption.textContent;
                menu.querySelectorAll('.custom-select-option').forEach(optionButton => {
                    const isSelected = optionButton.dataset.value === select.value;
                    optionButton.classList.toggle('selected', isSelected);
                    optionButton.setAttribute('aria-selected', String(isSelected));
                });
            }

            function closeSelect() {
                wrapper.classList.remove('open');
                trigger.setAttribute('aria-expanded', 'false');
            }

            trigger.addEventListener('click', event => {
                event.stopPropagation();
                document.querySelectorAll('.custom-select.open').forEach(openWrapper => {
                    if (openWrapper !== wrapper) openWrapper.classList.remove('open');
                });
                const isOpen = wrapper.classList.toggle('open');
                trigger.setAttribute('aria-expanded', String(isOpen));
            });

            trigger.addEventListener('keydown', event => {
                if (event.key === 'Escape') closeSelect();
                if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    wrapper.classList.add('open');
                    trigger.setAttribute('aria-expanded', 'true');
                }
            });

            menu.addEventListener('click', event => {
                const optionButton = event.target.closest('.custom-select-option');
                if (!optionButton) return;
                select.value = optionButton.dataset.value;
                select.dispatchEvent(new Event('change', { bubbles: true }));
                syncSelect();
                closeSelect();
                trigger.focus();
            });

            select.addEventListener('change', syncSelect);
            syncSelect();
        });

        document.addEventListener('click', event => {
            if (!event.target.closest('.custom-select')) document.querySelectorAll('.custom-select.open').forEach(wrapper => wrapper.classList.remove('open'));
        });
    }

    function syncCustomSelects() {
        document.querySelectorAll('.custom-select').forEach(wrapper => {
            const select = wrapper.querySelector('select');
            const selectedOption = select.options[select.selectedIndex] || select.options[0];
            wrapper.querySelector('.custom-select-trigger span').textContent = selectedOption.textContent;
            wrapper.querySelectorAll('.custom-select-option').forEach(optionButton => optionButton.classList.toggle('selected', optionButton.dataset.value === select.value));
        });
    }

    function numberValue(value) {
        if (value === '' || value === null || value === undefined) return NaN;
        const number = Number(value);
        return Number.isFinite(number) ? number : NaN;
    }

    // Calculate totals, percentage, attendance, and the final result for one student.
    function calculateRecord(record) {
        const enteredSubjects = record.subjects.filter(subject => subject.name?.trim() || ['theory', 'practical', 'attended', 'held'].some(field => Number.isFinite(numberValue(subject[field]))));
        const subjects = enteredSubjects.map(subject => {
            const theory = numberValue(subject.theory);
            const practical = numberValue(subject.practical);
            const total = (Number.isFinite(theory) ? theory : 0) + (Number.isFinite(practical) ? practical : 0);
            return { ...subject, theory, practical, total };
        });
        const totalMarks = subjects.reduce((sum, subject) => sum + subject.total, 0);
        const totalMaximum = subjects.length * 100;
        const percentage = totalMaximum ? (totalMarks / totalMaximum) * 100 : 0;
        const lecturesAttended = subjects.reduce((sum, subject) => sum + (Number.isFinite(subject.attended) ? subject.attended : 0), 0);
        const lecturesHeld = subjects.reduce((sum, subject) => sum + (Number.isFinite(subject.held) ? subject.held : 0), 0);
        const attendance = lecturesHeld ? (lecturesAttended / lecturesHeld) * 100 : 0;
        const hasSubjectBacklog = subjects.some(subject => subject.total < 33);
        let result = subjects.length ? 'Backlog / Fail' : 'No subjects';
        if (!hasSubjectBacklog && percentage >= 60) result = '1st Division';
        else if (!hasSubjectBacklog && percentage >= 45) result = '2nd Division';
        else if (!hasSubjectBacklog && percentage >= 33) result = '3rd Division';
        return { ...record, subjects, totalMarks, totalMaximum, percentage, lecturesAttended, lecturesHeld, attendance, hasSubjectBacklog, result, shortAttendance: attendance < ATTENDANCE_LIMIT };
    }

    function formatNumber(value, digits = 2) {
        return Number.isFinite(value) ? value.toFixed(digits) : (0).toFixed(digits);
    }

    function escapeHtml(value) {
        return String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[character]));
    }

    // Add one editable subject row to the dynamic subject table.
    function addSubjectRow(subject = {}) {
        const row = document.createElement('div');
        row.className = 'subjects-table subject-row';
        row.dataset.rowId = createId();
        row.innerHTML = `<div class="subject-name-cell"><input type="text" data-field="name" placeholder="e.g. Database Management" aria-label="Subject name"><div class="attendance-inline"><span>Attendance</span><input type="number" data-field="attended" min="0" step="1" placeholder="Attended" aria-label="Lectures attended"><b>/</b><input type="number" data-field="held" min="1" step="1" placeholder="Held" aria-label="Total lectures conducted"></div></div><span class="marks-max">50</span><input type="number" data-field="theory" min="0" max="50" step="1" placeholder="40" aria-label="Theory marks obtained out of 50"><span class="marks-max">50</span><input type="number" data-field="practical" min="0" max="50" step="1" placeholder="42" aria-label="Practical marks obtained out of 50"><button class="remove-subject" type="button" aria-label="Remove subject">&times;</button><small class="subject-error"></small>`;
        row.querySelector('[data-field="name"]').value = subject.name || '';
        ['theory', 'practical', 'attended', 'held'].forEach(field => {
            if (Number.isFinite(Number(subject[field]))) row.querySelector(`[data-field="${field}"]`).value = subject[field];
        });
        elements.subjectsList.append(row);
        updatePreview();
    }

    // Read every subject row and optionally display row-level validation messages.
    function readSubjectRows(showErrors = false) {
        const rows = [...elements.subjectsList.querySelectorAll('.subject-row')];
        const subjects = [];
        let valid = rows.length > 0;
        rows.forEach(row => {
            const subject = {
                name: row.querySelector('[data-field="name"]').value.trim(),
                theory: numberValue(row.querySelector('[data-field="theory"]').value),
                practical: numberValue(row.querySelector('[data-field="practical"]').value),
                attended: numberValue(row.querySelector('[data-field="attended"]').value),
                held: numberValue(row.querySelector('[data-field="held"]').value)
            };
            const rowValid = subject.name.length > 0 && Number.isFinite(subject.theory) && subject.theory >= 0 && subject.theory <= 50 && Number.isFinite(subject.practical) && subject.practical >= 0 && subject.practical <= 50 && Number.isFinite(subject.attended) && subject.attended >= 0 && Number.isFinite(subject.held) && subject.held > 0 && subject.attended <= subject.held;
            row.classList.toggle('invalid', showErrors && !rowValid);
            row.querySelector('.subject-error').textContent = showErrors && !rowValid ? 'Enter a name, marks 0-50, and valid attendance.' : '';
            if (!rowValid) valid = false;
            subjects.push(subject);
        });
        return { subjects, valid };
    }

    // Update the live totals shown below the subject table while the user types.
    function updatePreview() {
        const { subjects } = readSubjectRows(false);
        const preview = calculateRecord({ subjects });
        const hasSubjects = preview.subjects.length > 0;
        elements.previewTotal.textContent = `${preview.totalMarks} / ${preview.totalMaximum}`;
        elements.previewPercentage.textContent = `${formatNumber(preview.percentage)}%`;
        elements.previewAttendance.textContent = `${formatNumber(preview.attendance, 1)}%`;
        let status = hasSubjects ? preview.result : 'Add subjects';
        if (hasSubjects && preview.shortAttendance) status = 'Short attendance';
        elements.previewStatus.textContent = status;
        elements.previewStatus.classList.toggle('warning', Boolean(hasSubjects && (preview.shortAttendance || preview.result === 'Backlog / Fail')));
    }

    function validateIdentity() {
        const fields = [elements.fullName, elements.rollNumber, elements.branch, elements.semester];
        let valid = true;
        fields.forEach(field => {
            const value = field.value.trim();
            let message = '';
            if (!value) message = 'This field is required.';
            else if (field === elements.fullName && value.length < 3) message = 'Use at least 3 characters.';
            else if (field === elements.rollNumber && !/^[A-Za-z0-9-]+$/.test(value)) message = 'Use letters, numbers, or hyphens only.';
            field.closest('.field').classList.toggle('invalid', Boolean(message));
            field.closest('.field').querySelector('.field-error').textContent = message;
            if (message) valid = false;
        });
        const roll = elements.rollNumber.value.trim().toLowerCase();
        const duplicate = state.records.some(record => record.rollNumber.toLowerCase() === roll && record.id !== state.editingId);
        if (duplicate) {
            elements.rollNumber.closest('.field').classList.add('invalid');
            elements.rollNumber.closest('.field').querySelector('.field-error').textContent = 'This roll number already exists.';
            valid = false;
        }
        return valid;
    }

    function renderRecords() {
        const search = state.searchText.toLowerCase();
        const visibleRecords = state.records.map(calculateRecord).filter(record => record.fullName.toLowerCase().includes(search) || record.rollNumber.toLowerCase().includes(search));
        elements.recordsBody.innerHTML = visibleRecords.map(record => {
            const resultClass = record.result === '1st Division' ? 'result-first' : record.result === '2nd Division' ? 'result-second' : record.result === '3rd Division' ? 'result-third' : 'result-fail';
            return `<tr><td><span class="roll-number">${escapeHtml(record.rollNumber)}</span></td><td><span class="student-name">${escapeHtml(record.fullName)}<small>${escapeHtml(record.semester)}</small></span></td><td>${escapeHtml(record.branch)}</td><td><strong>${formatNumber(record.percentage)}%</strong></td><td><span class="attendance-badge ${record.shortAttendance ? 'attendance-short' : 'attendance-clear'}">${formatNumber(record.attendance, 1)}%${record.shortAttendance ? ' · Short' : ''}</span></td><td><span class="result-badge ${resultClass}">${record.result}</span></td><td><div class="action-buttons"><button class="table-button" type="button" data-action="view" data-id="${record.id}">View Marksheet</button><button class="table-button delete" type="button" data-action="delete" data-id="${record.id}">Delete</button></div></td></tr>`;
        }).join('');
        elements.recordCount.textContent = `${visibleRecords.length} ${visibleRecords.length === 1 ? 'record' : 'records'}`;
        elements.emptyState.hidden = visibleRecords.length > 0;
    }

    // Recalculate the four overview cards from all saved student records.
    function renderSummary() {
        const records = state.records.map(calculateRecord);
        const total = records.length;
        const average = total ? records.reduce((sum, record) => sum + record.percentage, 0) / total : 0;
        const cleared = records.filter(record => !record.shortAttendance).length;
        const backlog = records.filter(record => record.hasSubjectBacklog || record.result === 'Backlog / Fail').length;
        elements.totalStudents.textContent = total;
        elements.averagePercentage.textContent = `${formatNumber(average)}%`;
        elements.attendanceCleared.textContent = `${total ? Math.round((cleared / total) * 100) : 0}%`;
        elements.backlogCases.textContent = backlog;
    }

    function renderAll() {
        renderRecords();
        renderSummary();
        updatePreview();
    }

    function resetForm() {
        state.editingId = null;
        elements.form.reset();
        elements.subjectsList.innerHTML = '';
        addSubjectRow();
        addSubjectRow();
        addSubjectRow();
        elements.saveButton.innerHTML = 'Save student record <span aria-hidden="true">&#8594;</span>';
        elements.form.querySelectorAll('.field').forEach(field => field.classList.remove('invalid'));
        elements.form.querySelectorAll('.field-error').forEach(error => { error.textContent = ''; });
        syncCustomSelects();
        updatePreview();
    }

    function editRecord(record) {
        state.editingId = record.id;
        elements.fullName.value = record.fullName;
        elements.rollNumber.value = record.rollNumber;
        elements.branch.value = record.branch;
        elements.semester.value = record.semester;
        syncCustomSelects();
        elements.subjectsList.innerHTML = '';
        record.subjects.forEach(subject => addSubjectRow(subject));
        elements.saveButton.innerHTML = 'Update student record <span aria-hidden="true">&#8594;</span>';
        document.querySelector('#studentForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Create the printable marksheet HTML from the calculated record.
    function openMarksheet(record) {
        elements.marksheetContent.innerHTML = `<div class="marksheet-header"><p class="eyebrow">Polytechnic Academic Department</p><h2 id="marksheetTitle">Sessional &amp; Practical Marksheet</h2><p>Internal academic record</p></div><div class="student-details"><div class="student-detail"><span>Student name</span><strong>${escapeHtml(record.fullName)}</strong></div><div class="student-detail"><span>Enrollment / roll no.</span><strong>${escapeHtml(record.rollNumber)}</strong></div><div class="student-detail"><span>Branch</span><strong>${escapeHtml(record.branch)}</strong></div><div class="student-detail"><span>Semester</span><strong>${escapeHtml(record.semester)}</strong></div></div><table class="marksheet-table"><thead><tr><th>Subject name</th><th>Theory max marks</th><th>Theory obtained</th><th>Practical max marks</th><th>Practical obtained</th><th>Total</th></tr></thead><tbody>${record.subjects.map(subject => `<tr><td>${escapeHtml(subject.name)}</td><td>50</td><td>${subject.theory}</td><td>50</td><td>${subject.practical}</td><td><strong>${subject.total}</strong></td></tr>`).join('')}</tbody></table><div class="marksheet-summary"><div><span>Total marks</span><strong>${record.totalMarks} / ${record.totalMaximum}</strong></div><div><span>Overall percentage</span><strong>${formatNumber(record.percentage)}%</strong></div><div><span>Attendance</span><strong class="${record.shortAttendance ? 'warning-text' : ''}">${formatNumber(record.attendance, 1)}%${record.shortAttendance ? ' · Debarred warning' : ''}</strong></div></div><div class="marksheet-summary"><div><span>Final result</span><strong>${record.result}</strong></div></div><div class="signature-row"><span>Class teacher signature</span><span>Head of department signature</span></div>`;
        elements.marksheetModal.hidden = false;
        elements.closeModalButton.focus();
    }

    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        elements.toastRegion.append(toast);
        window.setTimeout(() => toast.remove(), 3500);
    }

    function downloadCsv() {
        const headings = ['Roll Number', 'Student Name', 'Branch', 'Semester', 'Total Marks', 'Maximum Marks', 'Percentage', 'Attendance', 'Final Result', 'Subjects'];
        const rows = state.records.map(calculateRecord).map(record => [record.rollNumber, record.fullName, record.branch, record.semester, record.totalMarks, record.totalMaximum, formatNumber(record.percentage), formatNumber(record.attendance, 1), record.result, record.subjects.map(subject => `${subject.name}: ${subject.total}/100`).join(' | ')]);
        const csv = [headings, ...rows].map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'polytechnic-student-records.csv';
        link.click();
        URL.revokeObjectURL(url);
        showToast('CSV file downloaded.', 'success');
    }

    // Submit either creates a new record or updates the record being edited.
    elements.form.addEventListener('submit', event => {
        event.preventDefault();
        const identityValid = validateIdentity();
        const subjectResult = readSubjectRows(true);
        if (!identityValid || !subjectResult.valid) {
            showToast('Please correct the highlighted fields.', 'error');
            return;
        }
        const record = { id: state.editingId || createId(), fullName: elements.fullName.value.trim(), rollNumber: elements.rollNumber.value.trim(), branch: elements.branch.value, semester: elements.semester.value, subjects: subjectResult.subjects, createdAt: new Date().toISOString() };
        if (state.editingId) {
            const index = state.records.findIndex(item => item.id === state.editingId);
            state.records[index] = { ...state.records[index], ...record };
            showToast('Student record updated.', 'success');
        } else {
            state.records.unshift(record);
            showToast('Student record saved.', 'success');
        }
        saveRecords();
        renderAll();
        resetForm();
    });

    elements.form.addEventListener('input', event => {
        if (event.target.closest('.field')) validateIdentity();
        updatePreview();
    });
    elements.form.addEventListener('change', updatePreview);
    elements.addSubjectButton.addEventListener('click', () => addSubjectRow());
    elements.subjectsList.addEventListener('click', event => {
        const removeButton = event.target.closest('.remove-subject');
        if (!removeButton) return;
        const rows = elements.subjectsList.querySelectorAll('.subject-row');
        if (rows.length === 1) {
            showToast('Keep at least one subject row.', 'warning');
            return;
        }
        removeButton.closest('.subject-row').remove();
        updatePreview();
    });
    elements.clearButton.addEventListener('click', event => { event.preventDefault(); resetForm(); });
    elements.searchInput.addEventListener('input', event => { state.searchText = event.target.value.trim(); renderRecords(); });
    elements.exportButton.addEventListener('click', downloadCsv);
    elements.recordsBody.addEventListener('click', event => {
        const button = event.target.closest('[data-action]');
        if (!button) return;
        const record = state.records.map(calculateRecord).find(item => item.id === button.dataset.id);
        if (!record) return;
        if (button.dataset.action === 'view') openMarksheet(record);
        if (button.dataset.action === 'delete' && window.confirm(`Delete the record for ${record.fullName}?`)) {
            state.records = state.records.filter(item => item.id !== record.id);
            saveRecords();
            renderAll();
            showToast('Student record deleted.', 'success');
        }
    });
    elements.closeModalButton.addEventListener('click', () => { elements.marksheetModal.hidden = true; });
    elements.marksheetModal.addEventListener('click', event => { if (event.target === elements.marksheetModal) elements.marksheetModal.hidden = true; });
    elements.printButton.addEventListener('click', () => window.print());
    elements.themeToggle.addEventListener('click', () => { document.body.classList.toggle('dark'); localStorage.setItem('polytechnic_theme', document.body.classList.contains('dark') ? 'dark' : 'light'); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && !elements.marksheetModal.hidden) elements.marksheetModal.hidden = true; });

    if (localStorage.getItem('polytechnic_theme') === 'dark') document.body.classList.add('dark');
    setupCustomSelects();
    resetForm();
    renderAll();
})();
