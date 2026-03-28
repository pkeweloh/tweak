import { Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  MatSnackBar,
  MatSnackBarRef,
  TextOnlySnackBar,
} from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { WeekSchedulerService } from 'src/app/shared/services/week-scheduler.service';
import { ColorUtils } from 'src/app/shared/utils/colors.utils';
import { Schedule } from 'src/app/shared/utils/types.utils';
import { MatDatepicker, MatDatepickerInputEvent } from '@angular/material/datepicker';

type FormatAction = 'header' | 'bold' | 'list' | 'quote' | 'link';

@Component({
  selector: 'app-dialoagbox',
  template: `
    <div class="dialog-container">
      <div class="dialog-header flex justify-between items-center mb-6">
        <div class="flex items-center gap-3">
          <div
            [ngClass]="[
              'w-6 h-6 rounded-full border dialog-color-circle',
              selectedColor()
            ]"
          ></div>
          <div class="text-xl font-bold text-gray-800">
            <ng-container *ngIf="!isSomedayTask; else somedayLabel">
              <button
                type="button"
                class="date-button"
                (click)="openDatepicker()"
              >
                <span>{{ scheduleData.date | date: 'dd.MM.YY' }}</span>
                <mat-icon>calendar_today</mat-icon>
              </button>
            </ng-container>
            <ng-template #somedayLabel>
              {{ 'CALENDER.SOMEDAY' | translate }}
            </ng-template>
          </div>
        </div>
        <div
          (click)="onDelete()"
          class="delete-btn p-2 rounded hover:bg-gray-200 cursor-pointer transition-colors"
        >
          <mat-icon style="color: #666;">delete_outline</mat-icon>
        </div>
      </div>

      <form [formGroup]="formGroup" class="dialog-body">
        <div *ngIf="!isSomedayTask">
          <input
            matInput
            formControlName="date"
            [matDatepicker]="datepicker"
            [matDatepickerFilter]="checkNotToProvidePreviousWeek"
            class="hidden-datepicker"
            (dateChange)="onCalendarDateChange($event)"
          />
          <mat-datepicker #datepicker></mat-datepicker>
        </div>

        <div class="todo-field">
          <textarea
            matInput
            formControlName="todo"
            #todoTextarea
            placeholder="{{ 'CALENDER.TODO_LABEL' | translate }}"
            class="todo-input"
            [class.todo-done-text]="scheduleData.finished"
            rows="1"
            wrap="soft"
            (input)="adjustTodoHeight()"
          ></textarea>
          <mat-checkbox
            class="todo-checkbox"
            [checked]="scheduleData.finished"
            (change)="toggleFinish($event.checked)"
            aria-label="Mark schedule finished"
          ></mat-checkbox>
        </div>

        <div class="mb-8 color-selector">
          <label class="block text-sm font-medium text-gray-500 mb-3">
            {{ 'CALENDER.ASSIGN_COLOR_LABEL' | translate }}
          </label>
          <div class="flex flex-wrap gap-4">
            <button
              *ngFor="let color of colors; let idx = index"
              [class]="
                'w-6 h-6 rounded-full border border-gray-600 cursor-pointer focus:ring-2 focus:ring-offset-2 focus:ring-black ' + 
                generateColor(idx)
              "
              (click)="setColor(idx)"
            ></button>
          </div>
        </div>

        <div class="notes-section" #notesSection>
          <div class="RichNotes-root" [class.RichNotes--focused]="isEditorActive">
              <div
                class="RichNotes-toolbar"
                role="toolbar"
                aria-label="Notes toolbar"
              >
              <button
                *ngFor="let option of formatToolbar"
                type="button"
                class="RichNotes-button"
                [ngClass]="{ 'RichNotes-button--active': isToolbarActive(option.action) }"
                (mousedown)="recordEditorSelection($event)"
                (click)="applyFormatting(option.action)"
                [disabled]="option.action === 'link' && isLinkDisabled()"
              >
                <i [ngClass]="option.icon"></i>
              </button>
            </div>
            <div class="DraftEditor-root">
              <div class="DraftEditor-editorContainer">
                <div
                  class="notranslate public-DraftEditor-content RichNotes-editor notes-editor"
                  #notesEditor
                  contenteditable="true"
                  role="textbox"
                  spellcheck="false"
                  tabindex="0"
                  (focus)="onEditorFocus()"
                  (blur)="onEditorBlur()"
                  (input)="onNotesInput()"
                  [attr.data-placeholder]=" 'CALENDER.NOTES_PLACEHOLDER' | translate "
                ></div>
              </div>
            </div>
          </div>
          <div
            class="link-tooltip"
            *ngIf="linkTooltipVisible"
            [ngClass]="{ 'link-tooltip--anchored': linkTooltipAnchored }"
            [ngStyle]="linkTooltipStyle"
          >
            <ng-container *ngIf="linkTooltipMode === 'preview'; else linkInputBlock">
              <div
                class="link-tooltip__text"
                role="link"
                tabindex="0"
                (click)="openUrlFromTooltip()"
              >
                {{ linkTooltipUrl }}
              </div>
              <div class="link-tooltip__actions">
                <button
                  type="button"
                  aria-label="Edit link"
                  (click)="onLinkTooltipEdit()"
                >
                  <i class="fa fa-edit"></i>
                </button>
                <button
                  type="button"
                  aria-label="Delete link"
                  (click)="deleteLinkAnchor()"
                >
                  <i class="fa fa-trash"></i>
                </button>
              </div>
            </ng-container>
            <ng-template #linkInputBlock>
              <input
                class="link-input"
                #linkInputField
                [value]="linkTooltipInputValue"
                (input)="linkTooltipInputValue = ($any($event.target)).value"
                (keydown.enter)="onLinkInputEnter($event)"
                placeholder="https://"
              />
              <div class="link-tooltip__actions">
                <button
                  type="button"
                  aria-label="Confirm link"
                  (click)="insertLinkFromTooltip()"
                >
                  <i class="fa-solid fa-check"></i>
                </button>
                <button
                  type="button"
                  aria-label="Cancel"
                  (click)="cancelLinkTooltip()"
                >
                  <i class="fa-solid fa-xmark"></i>
                </button>
              </div>
            </ng-template>
          </div>
        </div>
        <div class="dialog-actions flex justify-end gap-3 mt-4">
          <button class="btn-cancel" mat-button mat-dialog-close (click)="onCancel()">
            {{ 'COMMON.CANCEL' | translate }}
          </button>
          <button
            class="btn-save"
            mat-flat-button
            [mat-dialog-close]="onSave()"
            color="primary"
          >
            {{ 'COMMON.SAVE' | translate }}
          </button>
        </div>
      </form>
    </div>
  `,
  styleUrls: ['./dialoagbox.component.css'],
})
export class DialoagboxComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('datepicker') datepicker!: MatDatepicker<Date>;
  @ViewChild('todoTextarea') todoTextarea!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('notesEditor') notesEditor!: ElementRef<HTMLDivElement>;
  @ViewChild('notesSection', { read: ElementRef }) notesSection?: ElementRef<HTMLDivElement>;
  @ViewChild('linkInputField', { read: ElementRef }) linkInputField?: ElementRef<HTMLInputElement>;
  scheduleData: Schedule;
  colorCode: number = -1;

  colors: Array<string> = [];
  formatToolbar: Array<{ action: FormatAction; icon: string }> = [
    { action: 'header', icon: 'fa-solid fa-heading' },
    { action: 'bold', icon: 'fa-solid fa-bold' },
    { action: 'list', icon: 'fa-solid fa-list' },
    { action: 'quote', icon: 'fa-solid fa-stream' },
    { action: 'link', icon: 'fa-solid fa-link' },
  ];
  isSomedayTask: boolean = false;

  linkTooltipVisible = false;
  linkTooltipMode: 'insert' | 'edit' | 'preview' = 'insert';
  linkTooltipInputValue = '';
  activeAnchorElement?: HTMLAnchorElement;
  isEditorActive: boolean = false;
  isBoldActive: boolean = false;
  activeBlockType: FormatAction | null = null;
  linkTooltipUrl: string = '';
  linkTooltipStyle: Partial<CSSStyleDeclaration> = {};
  linkTooltipAnchored = false;
  private readonly caretMarker = '\u200B';
  private savedTextRange: Range | null = null;
  private suppressEditorSync: boolean = false;
  private initialNotesContent: string = '';
  private selectionListenerCleanup: Array<() => void> = [];
  private selectionChangeHandler = () => this.updateToolbarState();

  formGroup: FormGroup = new FormGroup({
    _id: new FormControl(''),
    __v: new FormControl(''),
    todo: new FormControl(''),
    date: new FormControl(''),
    colorCode: new FormControl(''),
    finished: new FormControl(''),
    username: new FormControl(''),
    createdAt: new FormControl(''),
    order: new FormControl(''),
    notes: new FormControl(''),
    isSomeday: new FormControl(null),
  });

  constructor(
    private weeklyScheduleService: WeekSchedulerService,
    @Inject(MAT_DIALOG_DATA)
    private dialogData: {
      payload: Schedule;
      reference: MatDialog;
      isSomedayList?: boolean;
    },
    private snackbar: MatSnackBar,
    private translate: TranslateService
  ) {
    this.scheduleData = dialogData.payload;
    this.isSomedayTask = !!dialogData.isSomedayList || !!dialogData.payload.isSomeday;
    const initialNotesValue = this.scheduleData.notes || '';
    this.formGroup.patchValue({
      ...this.scheduleData,
      notes: initialNotesValue,
    });
    this.formGroup.get('notes')?.setValue(initialNotesValue, { emitEvent: false });
    this.initialNotesContent = initialNotesValue;
  }

  ngOnInit(): void {
    this.colors = [...ColorUtils.COLORS];
  }

  openDatepicker() {
    this.datepicker?.open();
  }

  onCalendarDateChange(event: MatDatepickerInputEvent<Date>) {
    const selected = event?.value;
    if (!selected) return;
    const normalized = new Date(selected);
    normalized.setHours(12, 0, 0, 0);
    this.formGroup.patchValue({ date: normalized }, { emitEvent: false });
    this.scheduleData = { ...this.scheduleData, date: normalized };
  }

  adjustTodoHeight() {
    const el = this.todoTextarea?.nativeElement;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }

  toggleFinish(state: boolean) {
    this.formGroup.patchValue({ finished: state });
    this.scheduleData = { ...this.scheduleData, finished: state };
    const payload = {
      ...this.formGroup.value,
      colorCode:
        this.colorCode === -1
          ? this.formGroup.get('colorCode')?.value
          : this.colorCode,
    };
    this.weeklyScheduleService.updateSchedule(payload).subscribe(() => {});
  }

  setColor(idx: number) {
    this.colorCode = idx;
    const colorValue = String(idx);
    this.formGroup.patchValue({ colorCode: colorValue });
    this.scheduleData = { ...this.scheduleData, colorCode: colorValue };
  }

  checkNotToProvidePreviousWeek(d: Date | null) {
    const thresoldDate: Date = new Date(
      new Date().setDate(new Date().getDate() - new Date().getDay())
    );
    const date = d || new Date();
    return date >= thresoldDate;
  }

  onSave() {
    this.syncNotesFromEditor();
    return (this.dialogData.payload = {
      ...this.formGroup.value,
      colorCode:
        this.colorCode === -1
          ? this.formGroup.get('colorCode')?.value
          : this.colorCode,
    });
  }

  onCancel() {
    this.dialogData.payload = { ...this.scheduleData };
  }

  onDelete() {
    this.weeklyScheduleService
      .deleteSchedule({ ...this.scheduleData })
      .subscribe((response) => {
        this.dialogData.reference.closeAll();
        
        this.translate.get('CALENDER.SCHEDULE_DELETED').subscribe((message: string) => {
          const snackbarRef: MatSnackBarRef<TextOnlySnackBar> =
            this.snackbar.open(message, this.translate.instant('COMMON.UNDO'), {
              duration: 5000,
              panelClass: ['bg-red-600', 'text-white'],
            });

          snackbarRef.onAction().subscribe(() => {
            this.weeklyScheduleService
              .createSchedule({
                ...this.scheduleData,
                colorCode: String(this.scheduleData.colorCode),
              })
              .subscribe((response) => {
                this.translate.get('CALENDER.SCHEDULE_RESTORED').subscribe((restoredMsg: string) => {
                  this.snackbar.open(restoredMsg, this.translate.instant('COMMON.DONE'), {
                    duration: 3000,
                    panelClass: ['bg-green-600', 'text-white'],
                  });
                });
              });
          });
        });
      });
  }


  applyFormatting(action: FormatAction) {
    const editor = this.notesEditor?.nativeElement;
    if (!editor) return;

    if (action === 'link') {
      if (this.isLinkDisabled()) {
        return;
      }
      this.openLinkTooltip();
      return;
    }

    editor.focus();
    this.ensureEditorHasBlock();
    this.restoreSelection();

    switch (action) {
      case 'bold':
        if (!this.hasVisibleTextSelection() && this.isCurrentBlockEmpty()) {
          this.insertEmptyBoldPlaceholder();
        } else if (!this.hasVisibleTextSelection() && !this.isBoldActive) {
          this.insertBoldPlaceholderAtCaret();
        } else if (!this.canToggleBold()) {
          return;
        } else if (this.hasVisibleTextSelection() && this.getSelectedEditableBlocks().length > 1) {
          this.toggleBoldAcrossBlocks(this.getSelectedEditableBlocks());
        } else if (this.activeBlockType === 'header' && this.hasVisibleTextSelection() && !this.isBoldActive) {
          this.wrapSelectionWithBold();
        } else {
          document.execCommand('bold');
        }
        this.cleanupBoldMarkup();
        break;
      case 'header':
        this.toggleBlockFormat('header');
        break;
      case 'quote':
        this.toggleBlockFormat('quote');
        break;
      case 'list':
        if (!this.hasVisibleTextSelection() && this.isCurrentBlockEmpty()) {
          this.insertEmptyListPlaceholder();
          break;
        }
        this.toggleBlockFormat('list');
        break;
    }

    this.syncNotesFromEditor();
    setTimeout(() => this.updateToolbarState(), 0);
  }

  isToolbarActive(action: FormatAction): boolean {
    if (action === 'bold') {
      return this.isBoldActive;
    }
    if (action === 'link') {
      return false;
    }
    return this.activeBlockType === action;
  }

  isLinkDisabled(): boolean {
    return !this.hasVisibleTextSelection();
  }

  private updateToolbarState() {
    if (typeof document === 'undefined') {
      this.isBoldActive = false;
      this.activeBlockType = null;
      return;
    }

    this.isBoldActive = this.detectBoldState();
    this.activeBlockType = this.detectActiveBlockType();
  }

  private toggleBlockFormat(action: 'header' | 'quote' | 'list') {
    const blocks = this.getSelectedEditableBlocks();
    if (!blocks.length) return;

    const targetType: 'paragraph' | 'header' | 'quote' | 'list' =
      blocks.every((block) => this.getBlockType(block) === action) ? 'paragraph' : action;

    const replacements = this.replaceBlockElements(blocks, targetType);
    this.focusBlocksContents(replacements, blocks.length > 1);
  }

  private ensureEditorHasBlock() {
    const editor = this.notesEditor?.nativeElement;
    if (!editor) {
      return;
    }

    if (editor.innerHTML.trim()) {
      this.normalizeEditorRoot(editor);
      return;
    }

    const paragraph = document.createElement('p');
    paragraph.appendChild(document.createElement('br'));
    editor.appendChild(paragraph);
    this.focusBlockContents(paragraph);
  }

  private getCurrentEditableBlock(): HTMLElement | null {
    const editor = this.notesEditor?.nativeElement;
    if (!editor) {
      return null;
    }

    this.normalizeEditorRoot(editor);

    const selection = window.getSelection();
    const anchorNode = selection?.anchorNode || this.savedTextRange?.startContainer || editor;
    const block = this.findClosestBlock(anchorNode);
    if (block) {
      return block;
    }

    const firstChild = editor.firstElementChild as HTMLElement | null;
    if (firstChild) {
      return firstChild;
    }

    this.ensureEditorHasBlock();
    return editor.firstElementChild as HTMLElement | null;
  }

  private getSelectedEditableBlocks(): HTMLElement[] {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !this.isSelectionInsideEditor(selection)) {
      const currentBlock = this.getCurrentEditableBlock();
      return currentBlock ? [currentBlock] : [];
    }

    const range = selection.getRangeAt(0);
    const orderedBlocks = this.getSelectableBlocksInOrder();
    const startBlock = this.getSelectableBlockFromNode(range.startContainer);
    const endBlock = this.getSelectableBlockFromNode(range.endContainer);

    if (startBlock && endBlock) {
      const startIndex = orderedBlocks.indexOf(startBlock);
      const endIndex = orderedBlocks.indexOf(endBlock);
      if (startIndex !== -1 && endIndex !== -1) {
        const from = Math.min(startIndex, endIndex);
        const to = Math.max(startIndex, endIndex);
        return orderedBlocks.slice(from, to + 1);
      }
    }

    const currentBlock = this.getCurrentEditableBlock();
    return currentBlock ? [currentBlock] : [];
  }

  private getSelectableBlocksInOrder(): HTMLElement[] {
    const editor = this.notesEditor?.nativeElement;
    if (!editor) {
      return [];
    }

    const blocks: HTMLElement[] = [];
    Array.from(editor.children).forEach((child) => {
      const element = child as HTMLElement;
      const tag = element.tagName.toLowerCase();

      if (tag === 'ul') {
        blocks.push(...Array.from(element.children).filter((li) => li.tagName.toLowerCase() === 'li') as HTMLElement[]);
        return;
      }

      if (tag === 'blockquote') {
        const innerBlocks = Array.from(element.children).filter((inner) =>
          ['div', 'p', 'h4'].includes(inner.tagName.toLowerCase())
        ) as HTMLElement[];
        if (innerBlocks.length) {
          blocks.push(...innerBlocks);
        } else {
          blocks.push(element);
        }
        return;
      }

      if (['p', 'div', 'h4'].includes(tag)) {
        blocks.push(element);
      }
    });

    return blocks;
  }

  private getSelectableBlockFromNode(node: Node | null): HTMLElement | null {
    const editor = this.notesEditor?.nativeElement;
    let current: Node | null = node;

    while (current && current !== editor) {
      if (current.nodeType === Node.ELEMENT_NODE) {
        const element = current as HTMLElement;
        const tag = element.tagName.toLowerCase();
        const parentTag = element.parentElement?.tagName.toLowerCase();

        if (tag === 'li' && parentTag === 'ul') {
          return element;
        }

        if (['div', 'p', 'h4'].includes(tag) && parentTag === 'blockquote') {
          return element;
        }

        if (['p', 'div', 'h4', 'blockquote'].includes(tag) && element.parentElement === editor) {
          return element;
        }
      }
      current = current.parentNode;
    }

    return null;
  }

  private normalizeEditorRoot(editor: HTMLDivElement) {
    const hasElementChildren = Array.from(editor.childNodes).some(
      (node) => node.nodeType === Node.ELEMENT_NODE
    );

    if (hasElementChildren || !editor.childNodes.length) {
      return;
    }

    const paragraph = document.createElement('p');
    while (editor.firstChild) {
      paragraph.appendChild(editor.firstChild);
    }
    editor.appendChild(paragraph);
  }

  private findClosestBlock(node: Node | null): HTMLElement | null {
    const editor = this.notesEditor?.nativeElement;
    let current: Node | null = node;
    let fallbackBlock: HTMLElement | null = null;

    while (current && current !== editor) {
      if (current.nodeType === Node.ELEMENT_NODE) {
        const element = current as HTMLElement;
        const tag = element.tagName.toLowerCase();
        if (tag === 'li' || tag === 'h4' || tag === 'blockquote') {
          return element;
        }
        if (!fallbackBlock && (tag === 'p' || tag === 'div')) {
          fallbackBlock = element;
        }
      }
      current = current.parentNode;
    }

    return fallbackBlock;
  }

  private replaceBlockElement(
    block: HTMLElement,
    targetType: 'paragraph' | 'header' | 'quote' | 'list'
  ): HTMLElement {
    const html = this.getBlockInnerHtml(block);

    if (targetType === 'list') {
      return this.replaceWithList(block, html);
    }

    const replacementTag = targetType === 'header' ? 'h4' : targetType === 'quote' ? 'blockquote' : 'p';
    const replacement = document.createElement(replacementTag);
    replacement.innerHTML = html;
    this.replaceBlockNode(block, replacement);
    this.cleanupEmptyList(block);
    return replacement;
  }

  private replaceBlockElements(
    blocks: HTMLElement[],
    targetType: 'paragraph' | 'header' | 'quote' | 'list'
  ): HTMLElement[] {
    if (targetType === 'list') {
      return this.replaceBlocksWithList(blocks);
    }

    if (targetType === 'quote') {
      return this.replaceBlocksWithQuote(blocks);
    }

    return this.replaceBlocksWithStandaloneBlocks(blocks, targetType);
  }

  private replaceBlocksWithList(blocks: HTMLElement[]): HTMLElement[] {
    const insertionPoint = this.getInsertionPointForBlocks(blocks);
    const parent = insertionPoint.parentNode;
    const list = document.createElement('ul');
    const createdItems: HTMLElement[] = [];

    blocks.forEach((block) => {
      const item = document.createElement('li');
      item.innerHTML = this.getNormalizedBlockHtml(block, 'list');
      list.appendChild(item);
      createdItems.push(item);
    });

    parent?.insertBefore(list, insertionPoint.referenceNode);
    this.removeOriginalBlocks(blocks);
    this.removeEmptyLists();
    return createdItems.length ? createdItems : [(list.querySelector('li') as HTMLElement) || list];
  }

  private replaceBlocksWithStandaloneBlocks(
    blocks: HTMLElement[],
    targetType: 'paragraph' | 'header' | 'quote'
  ): HTMLElement[] {
    const insertionPoint = this.getInsertionPointForBlocks(blocks);
    const parent = insertionPoint.parentNode;
    const fragment = document.createDocumentFragment();
    const tagName = targetType === 'header' ? 'h4' : targetType === 'quote' ? 'blockquote' : 'p';
    const createdBlocks: HTMLElement[] = [];

    blocks.forEach((block) => {
      const replacement = document.createElement(tagName);
      replacement.innerHTML = this.getNormalizedBlockHtml(block, targetType);
      createdBlocks.push(replacement);
      fragment.appendChild(replacement);
    });

    parent?.insertBefore(fragment, insertionPoint.referenceNode);
    this.removeOriginalBlocks(blocks);
    this.removeEmptyLists();
    return createdBlocks;
  }

  private replaceBlocksWithQuote(blocks: HTMLElement[]): HTMLElement[] {
    const insertionPoint = this.getInsertionPointForBlocks(blocks);
    const parent = insertionPoint.parentNode;
    const quote = document.createElement('blockquote');
    const createdBlocks: HTMLElement[] = [];

    blocks.forEach((block) => {
      const line = document.createElement('div');
      line.innerHTML = this.getNormalizedBlockHtml(block, 'quote');
      createdBlocks.push(line);
      quote.appendChild(line);
    });

    parent?.insertBefore(quote, insertionPoint.referenceNode);

    this.removeOriginalBlocks(blocks);
    this.removeEmptyLists();
    this.removeEmptyQuotes();
    return createdBlocks.length ? createdBlocks : [quote];
  }

  private getInsertionPointForBlocks(blocks: HTMLElement[]): { parentNode: Node | null; referenceNode: Node | null } {
    const firstBlock = blocks[0];
    const lastBlock = blocks[blocks.length - 1];
    const startContainer = this.getWrappableParentContainer(firstBlock);
    const endContainer = this.getWrappableParentContainer(lastBlock);

    if (startContainer) {
      const activeStartContainer = this.splitParentContainerBeforeBlock(startContainer, firstBlock);
      const activeEndContainer =
        endContainer && endContainer === activeStartContainer
          ? activeStartContainer
          : endContainer;

      if (activeEndContainer) {
        this.splitParentContainerAfterBlock(activeEndContainer, lastBlock);
      }

      return {
        parentNode: activeStartContainer.parentNode,
        referenceNode: activeStartContainer,
      };
    }

    if (endContainer) {
      this.splitParentContainerAfterBlock(endContainer, lastBlock);
    }

    return { parentNode: firstBlock.parentNode, referenceNode: firstBlock };
  }

  private getWrappableParentContainer(block: HTMLElement): HTMLElement | null {
    const parent = block.parentElement;
    const tag = parent?.tagName.toLowerCase();
    return tag === 'ul' || tag === 'blockquote' ? parent : null;
  }

  private splitParentContainerBeforeBlock(parent: HTMLElement, firstBlock: HTMLElement): HTMLElement {
    const leadingSiblings: HTMLElement[] = [];
    let current = parent.firstElementChild as HTMLElement | null;

    while (current && current !== firstBlock) {
      const next = current.nextElementSibling as HTMLElement | null;
      leadingSiblings.push(current);
      current = next;
    }

    if (!leadingSiblings.length) {
      return parent;
    }

    const leadingContainer = parent.cloneNode(false) as HTMLElement;
    leadingSiblings.forEach((sibling) => leadingContainer.appendChild(sibling));
    parent.parentNode?.insertBefore(leadingContainer, parent);
    return parent;
  }

  private splitParentContainerAfterBlock(parent: HTMLElement, lastBlock: HTMLElement): HTMLElement | null {
    const trailingSiblings: HTMLElement[] = [];
    let current = lastBlock.nextElementSibling as HTMLElement | null;

    while (current) {
      trailingSiblings.push(current);
      current = current.nextElementSibling as HTMLElement | null;
    }

    if (!trailingSiblings.length) {
      return null;
    }

    const trailingContainer = parent.cloneNode(false) as HTMLElement;
    trailingSiblings.forEach((sibling) => trailingContainer.appendChild(sibling));
    parent.parentNode?.insertBefore(trailingContainer, parent.nextSibling);
    return trailingContainer;
  }

  private removeOriginalBlocks(blocks: HTMLElement[]) {
    const processedLists = new Set<HTMLElement>();
    const processedQuotes = new Set<HTMLElement>();

    blocks.forEach((block) => {
      if (block.tagName.toLowerCase() === 'li') {
        const list = block.parentElement as HTMLElement | null;
        block.remove();
        if (list) {
          processedLists.add(list);
        }
        return;
      }

      if (block.parentElement?.tagName.toLowerCase() === 'blockquote') {
        processedQuotes.add(block.parentElement);
      }

      block.remove();
    });

    processedLists.forEach((list) => {
      if (!list.querySelector('li')) {
        list.remove();
      }
    });

    processedQuotes.forEach((quote) => {
      if (!quote.children.length || !quote.textContent?.trim()) {
        quote.remove();
      }
    });
  }

  private replaceWithList(block: HTMLElement, html: string): HTMLElement {
    const list = document.createElement('ul');
    const item = document.createElement('li');
    item.innerHTML = html;
    list.appendChild(item);

    this.replaceBlockNode(block, list);
    this.cleanupEmptyList(block);
    return item;
  }

  private replaceBlockNode(block: HTMLElement, replacement: HTMLElement) {
    if (block.tagName.toLowerCase() === 'li') {
      const list = block.parentElement;
      list?.parentElement?.insertBefore(replacement, list.nextSibling);
      block.remove();
      this.removeEmptyLists();
      return;
    }

    block.replaceWith(replacement);
    this.removeEmptyLists();
  }

  private cleanupEmptyList(originalBlock: HTMLElement) {
    if (originalBlock.tagName.toLowerCase() !== 'li') {
      return;
    }

    const list = originalBlock.parentElement;
    if (list && list.tagName.toLowerCase() === 'ul' && !list.querySelector('li')) {
      list.remove();
    }
  }

  private removeEmptyLists() {
    const editor = this.notesEditor?.nativeElement;
    if (!editor) {
      return;
    }

    Array.from(editor.querySelectorAll('ul')).forEach((list) => {
      const items = Array.from(list.children).filter(
        (child) => child.tagName.toLowerCase() === 'li' && child.textContent?.trim()
      );

      if (!items.length) {
        list.remove();
      }
    });
  }

  private getBlockInnerHtml(block: HTMLElement): string {
    const html = block.innerHTML?.trim();
    return html && html !== '<br>' ? html : '<br>';
  }

  private getNormalizedBlockHtml(
    block: HTMLElement,
    targetType: 'paragraph' | 'header' | 'quote' | 'list'
  ): string {
    const html = this.getBlockInnerHtml(block);

    if (targetType === 'quote' || targetType === 'header' || targetType === 'paragraph') {
      return html.replace(/^<li[^>]*>/i, '').replace(/<\/li>$/i, '');
    }

    if (targetType === 'list') {
      return html
        .replace(/^<div[^>]*>/i, '')
        .replace(/<\/div>$/i, '')
        .replace(/^<blockquote[^>]*>/i, '')
        .replace(/<\/blockquote>$/i, '');
    }

    return html;
  }

  private focusBlockContents(block: HTMLElement) {
    const target = block.tagName.toLowerCase() === 'ul'
      ? (block.querySelector('li') as HTMLElement | null) || block
      : block;
    const range = document.createRange();
    range.selectNodeContents(target);
    range.collapse(false);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    this.savedTextRange = range.cloneRange();
  }

  private focusBlocksContents(blocks: HTMLElement[], preserveSelection: boolean) {
    if (!blocks.length) {
      return;
    }

    if (!preserveSelection) {
      this.focusBlockContents(blocks[blocks.length - 1]);
      return;
    }

    const firstBlock = blocks[0];
    const lastBlock = blocks[blocks.length - 1];
    const range = document.createRange();
    range.setStart(firstBlock, 0);
    range.setEnd(lastBlock, lastBlock.childNodes.length);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    this.savedTextRange = range.cloneRange();
  }

  private focusEmptyInlineElement(element: HTMLElement) {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(false);
    selection?.removeAllRanges();
    selection?.addRange(range);
    this.savedTextRange = range.cloneRange();
  }

  private focusEmptyBlockElement(element: HTMLElement) {
    const textNode = element.firstChild;
    if (textNode?.nodeType === Node.TEXT_NODE) {
      this.focusTextNodeEnd(textNode);
      return;
    }

    const selection = window.getSelection();
    const range = document.createRange();
    range.setStart(element, 0);
    range.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(range);
    this.savedTextRange = range.cloneRange();
  }

  private focusTextNodeEnd(node: Node) {
    const selection = window.getSelection();
    const range = document.createRange();
    const textLength = node.textContent?.length || 0;
    range.setStart(node, textLength);
    range.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(range);
    this.savedTextRange = range.cloneRange();
  }

  private toggleBoldAcrossBlocks(blocks: HTMLElement[]) {
    const shouldRemoveBold = blocks.every((block) => this.isBlockFullyBold(block));

    blocks.forEach((block) => {
      if (shouldRemoveBold) {
        this.removeFullBlockBold(block);
        return;
      }

      this.applyFullBlockBold(block);
    });
  }

  private applyFullBlockBold(block: HTMLElement) {
    if (this.isBlockFullyBold(block)) {
      return;
    }

    const strong = document.createElement('strong');
    strong.innerHTML = this.getBlockInnerHtml(block);
    block.innerHTML = '';
    block.appendChild(strong);
  }

  private removeFullBlockBold(block: HTMLElement) {
    const firstElement = block.firstElementChild as HTMLElement | null;
    if (!firstElement) {
      return;
    }

    const tag = firstElement.tagName.toLowerCase();
    if ((tag === 'strong' || tag === 'b') && firstElement === block.firstElementChild && firstElement === block.lastElementChild) {
      this.unwrapElement(firstElement);
    }
  }

  private isBlockFullyBold(block: HTMLElement): boolean {
    const meaningfulChildren = Array.from(block.childNodes).filter((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        return !!node.textContent?.trim();
      }
      return true;
    });

    if (meaningfulChildren.length !== 1) {
      return false;
    }

    const onlyChild = meaningfulChildren[0];
    return (
      onlyChild.nodeType === Node.ELEMENT_NODE &&
      ['strong', 'b'].includes((onlyChild as HTMLElement).tagName.toLowerCase())
    );
  }

  private insertEmptyBoldPlaceholder() {
    const block = this.getCurrentEditableBlock();
    if (!block) {
      return;
    }

    const strong = document.createElement('strong');
    strong.appendChild(document.createTextNode(this.caretMarker));
    block.innerHTML = '';
    block.appendChild(strong);
    this.focusEmptyInlineElement(strong);
    this.isBoldActive = true;
  }

  private insertBoldPlaceholderAtCaret() {
    const range = this.getSavedEditorRange();
    if (!range || !range.collapsed) {
      return;
    }

    const strong = document.createElement('strong');
    strong.appendChild(document.createTextNode(this.caretMarker));
    range.insertNode(strong);
    this.focusEmptyInlineElement(strong);
    this.isBoldActive = true;
  }

  private insertEmptyListPlaceholder() {
    const block = this.getCurrentEditableBlock();
    if (!block) {
      return;
    }

    const list = document.createElement('ul');
    const item = document.createElement('li');
    item.appendChild(document.createTextNode(this.caretMarker));
    list.appendChild(item);
    this.replaceBlockNode(block, list);
    this.focusEmptyBlockElement(item);
    this.activeBlockType = 'list';
  }

  private wrapSelectionWithBold() {
    const range = this.getEditorSelectionRange();
    if (!range || range.collapsed || !range.toString().trim()) {
      return;
    }

    const strong = document.createElement('strong');
    strong.appendChild(range.extractContents());
    range.insertNode(strong);

    const selection = window.getSelection();
    const newRange = document.createRange();
    newRange.selectNodeContents(strong);
    selection?.removeAllRanges();
    selection?.addRange(newRange);
    this.savedTextRange = newRange.cloneRange();
  }

  private cleanupBoldMarkup() {
    const editor = this.notesEditor?.nativeElement;
    if (!editor) {
      return;
    }

    Array.from(editor.querySelectorAll('span')).forEach((span) => {
      const weight = span.style.fontWeight?.trim().toLowerCase();
      if (weight === 'normal' || weight === '400') {
        this.unwrapElement(span);
      }
    });
  }

  private unwrapElement(element: HTMLElement) {
    const parent = element.parentNode;
    if (!parent) {
      return;
    }

    while (element.firstChild) {
      parent.insertBefore(element.firstChild, element);
    }
    parent.removeChild(element);
  }

  private getEditorSelectionRange(): Range | null {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount || !this.isSelectionInsideEditor(selection)) {
      return null;
    }

    return selection.getRangeAt(0);
  }

  private getBlockType(block: HTMLElement): 'paragraph' | 'header' | 'quote' | 'list' {
    const tag = block.tagName.toLowerCase();
    if (tag === 'h4') {
      return 'header';
    }
    if (tag === 'blockquote' || block.parentElement?.tagName.toLowerCase() === 'blockquote') {
      return 'quote';
    }
    if (tag === 'li') {
      return 'list';
    }
    return 'paragraph';
  }

  private isCurrentBlockEmpty(): boolean {
    const block = this.getCurrentEditableBlock();
    return !block || !block.textContent?.trim();
  }

  private removeEmptyQuotes() {
    const editor = this.notesEditor?.nativeElement;
    if (!editor) {
      return;
    }

    Array.from(editor.querySelectorAll('blockquote')).forEach((quote) => {
      if (!quote.textContent?.trim() && !quote.querySelector('br')) {
        quote.remove();
      }
    });
  }

  private detectActiveBlockType(): FormatAction | null {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !this.isSelectionInsideEditor(selection)) {
      return null;
    }
    const block = this.findClosestBlock(selection.anchorNode);
    if (!block) {
      return null;
    }

    const tag = block.tagName?.toLowerCase();
    if (tag === 'h4') {
      return 'header';
    }
    if (tag === 'blockquote') {
      return 'quote';
    }
    if (tag === 'li') {
      return 'list';
    }
    return null;
  }

  private detectBoldState(): boolean {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !this.isSelectionInsideEditor(selection)) {
      return false;
    }

    let node: Node | null = selection.anchorNode;
    const editorElement = this.notesEditor?.nativeElement;
    while (node && node !== editorElement) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const elem = node as Element;
        const tag = elem.tagName?.toLowerCase();
        if (tag === 'strong' || tag === 'b') {
          return true;
        }
        const fontWeight = window.getComputedStyle(elem).fontWeight;
        const numericWeight = parseInt(fontWeight, 10);
        if (
          (fontWeight === 'bold' ||
            fontWeight === 'bolder' ||
            (!Number.isNaN(numericWeight) && numericWeight >= 700)) &&
          tag !== 'h4'
        ) {
          return true;
        }
      }
      node = node.parentNode;
    }

    return false;
  }

  private canToggleBold(): boolean {
    if (this.hasVisibleTextSelection()) {
      return true;
    }
    return this.isBoldActive;
  }

  private hasVisibleTextSelection(): boolean {
    const selection = window.getSelection();
    if (!selection || !this.isSelectionInsideEditor(selection)) return false;
    return selection.toString().trim().length > 0;
  }

  onNotesInput() {
    this.syncNotesFromEditor();
    this.updateToolbarState();
  }

  onEditorFocus() {
    this.isEditorActive = true;
    this.updateToolbarState();
  }

  onEditorBlur() {
    this.isEditorActive = false;
    this.syncNotesFromEditor();
    this.updateToolbarState();
  }

  syncNotesFromEditor() {
    if (this.suppressEditorSync) {
      return;
    }

    const editor = this.notesEditor?.nativeElement;
    if (!editor) return;

    const textContent = editor.textContent?.split(this.caretMarker).join('').trim();
    let htmlContent = editor.innerHTML.split(this.caretMarker).join('');
    if (!textContent && !this.shouldPreserveEmptyMarkup(editor)) {
      htmlContent = '';
      editor.innerHTML = '';
    }

    this.formGroup.get('notes')?.setValue(htmlContent, { emitEvent: false });
    this.scheduleData = {
      ...this.scheduleData,
      notes: htmlContent,
    };
  }


  recordEditorSelection(event: MouseEvent) {
    event.preventDefault();
    this.saveCurrentSelection();
    this.updateToolbarState();
  }

  private handleEditorAnchorClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const anchor = target.closest('a') as HTMLAnchorElement | null;
    if (!anchor) {
      this.cancelLinkTooltip();
      return;
    }
    event.preventDefault();
    this.openLinkTooltipFromAnchor(anchor);
  }

  private openLinkTooltip() {
    this.saveCurrentSelection();
    this.linkTooltipVisible = true;
    this.linkTooltipMode = 'insert';
    this.linkTooltipAnchored = true;
    this.activeAnchorElement = undefined;
    this.linkTooltipInputValue = '';
    this.linkTooltipStyle = this.computeTooltipStyleForSelection();
    setTimeout(() => this.linkInputField?.nativeElement?.focus(), 0);
  }

  private openLinkTooltipFromAnchor(anchor: HTMLAnchorElement) {
    this.activeAnchorElement = anchor;
    this.linkTooltipUrl = anchor.getAttribute('href') || '';
    this.linkTooltipMode = 'preview';
    this.linkTooltipAnchored = true;
    this.linkTooltipVisible = true;
    this.linkTooltipStyle = this.computeTooltipStyleForAnchor(anchor);
  }

  private computeTooltipStyleForAnchor(anchor: HTMLAnchorElement): Partial<CSSStyleDeclaration> {
    const sectionRect = this.notesSection?.nativeElement?.getBoundingClientRect();
    if (!sectionRect) return {};
    const anchorRect = anchor.getBoundingClientRect();
    const tooltipWidth = 280;
    const horizontalPadding = 12;
    let left = anchorRect.left - sectionRect.left;
    left = Math.max(horizontalPadding, left);
    const maxLeft = Math.max(0, sectionRect.width - tooltipWidth - horizontalPadding);
    left = Math.min(left, maxLeft);
    const top = anchorRect.bottom - sectionRect.top + 8;
    return { top: `${top}px`, left: `${left}px` };
  }

  private computeTooltipStyleForSelection(): Partial<CSSStyleDeclaration> {
    const sectionRect = this.notesSection?.nativeElement?.getBoundingClientRect();
    const range = this.savedTextRange;
    if (!sectionRect || !range) {
      return {};
    }

    const selectionRect = range.getBoundingClientRect();
    const tooltipWidth = 280;
    const horizontalPadding = 12;
    let left = selectionRect.left - sectionRect.left;
    left = Math.max(horizontalPadding, left);
    const maxLeft = Math.max(0, sectionRect.width - tooltipWidth - horizontalPadding);
    left = Math.min(left, maxLeft);
    const top = selectionRect.bottom - sectionRect.top + 8;
    return { top: `${top}px`, left: `${left}px` };
  }

  onLinkTooltipEdit() {
    if (!this.activeAnchorElement) return;
    this.linkTooltipMode = 'edit';
    this.linkTooltipInputValue = this.linkTooltipUrl;
    this.linkTooltipAnchored = true;
    this.linkTooltipStyle = this.computeTooltipStyleForAnchor(this.activeAnchorElement);
    setTimeout(() => this.linkInputField?.nativeElement?.focus(), 0);
  }

  openUrlFromTooltip() {
    if (!this.linkTooltipUrl) return;
    window.open(this.linkTooltipUrl, '_blank');
  }

  deleteLinkAnchor() {
    if (!this.activeAnchorElement) return;
    const textNode = document.createTextNode(this.activeAnchorElement.textContent || '');
    this.activeAnchorElement.replaceWith(textNode);
    this.syncNotesFromEditor();
    this.cancelLinkTooltip();
  }

  insertLinkFromTooltip() {
    const url = this.normalizeValidUrl(this.linkTooltipInputValue);
    if (!url) return;

    if (this.linkTooltipMode === 'edit' && this.activeAnchorElement) {
      this.activeAnchorElement.setAttribute('href', url);
      this.linkTooltipUrl = url;
      this.linkTooltipInputValue = url;
      this.linkTooltipMode = 'preview';
      this.syncNotesFromEditor();
      return;
    }

    const editor = this.notesEditor?.nativeElement;
    if (!editor) {
      this.cancelLinkTooltip();
      return;
    }

    this.ensureEditorHasBlock();
    const range = this.getSavedEditorRange();
    if (!range || range.collapsed || !range.toString().trim()) {
      this.cancelLinkTooltip();
      return;
    }

    editor.focus();
    const anchor = document.createElement('a');
    anchor.setAttribute('href', url);
    anchor.appendChild(range.extractContents());
    range.insertNode(anchor);
    this.focusBlockContents(anchor);
    this.syncNotesFromEditor();
    this.openLinkTooltipFromAnchor(anchor);
  }

  onLinkInputEnter(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.insertLinkFromTooltip();
  }

  private normalizeValidUrl(rawValue: string): string | null {
    const value = (rawValue || '').trim();
    if (!value) {
      return null;
    }

    try {
      const parsed = new URL(value);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return null;
      }
      return parsed.toString();
    } catch {
      return null;
    }
  }

  private findAnchorFromSelection(): HTMLAnchorElement | null {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !this.isSelectionInsideEditor(selection)) return null;
    let node: Node | null = selection.anchorNode;
    const editor = this.notesEditor?.nativeElement;
    while (node && node !== editor) {
      if (node.nodeType === Node.ELEMENT_NODE && (node as Element).tagName?.toLowerCase() === 'a') {
        return node as HTMLAnchorElement;
      }
      node = node.parentNode;
    }
    return null;
  }

  private getSavedEditorRange(): Range | null {
    if (this.savedTextRange && this.isRangeInsideEditor(this.savedTextRange)) {
      return this.savedTextRange.cloneRange();
    }

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && this.isSelectionInsideEditor(selection)) {
      return selection.getRangeAt(0).cloneRange();
    }

    return null;
  }

  cancelLinkTooltip() {
    this.linkTooltipVisible = false;
    this.linkTooltipInputValue = '';
    this.activeAnchorElement = undefined;
    this.linkTooltipMode = 'insert';
    this.linkTooltipUrl = '';
    this.linkTooltipStyle = {};
    this.linkTooltipAnchored = false;
    this.savedTextRange = null;
  }

  private attachEditorSelectionListeners() {
    const editor = this.notesEditor?.nativeElement;
    if (!editor) return;

    ['mouseup', 'keyup', 'touchend'].forEach((eventName) => {
      const handler = () => {
        this.saveCurrentSelection();
        this.updateToolbarState();
      };
      editor.addEventListener(eventName, handler);
      this.selectionListenerCleanup.push(() =>
        editor.removeEventListener(eventName, handler)
      );
    });

    document.addEventListener('selectionchange', this.selectionChangeHandler);
    this.selectionListenerCleanup.push(() =>
      document.removeEventListener('selectionchange', this.selectionChangeHandler)
    );

    const clickHandler = (event: MouseEvent) => this.handleEditorAnchorClick(event);
    editor.addEventListener('click', clickHandler);
    this.selectionListenerCleanup.push(() =>
      editor.removeEventListener('click', clickHandler)
    );
  }

  private saveCurrentSelection() {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && this.isSelectionInsideEditor(selection)) {
      this.savedTextRange = selection.getRangeAt(0).cloneRange();
    }
  }

  private restoreSelection() {
    const selection = window.getSelection();
    if (selection && this.savedTextRange && this.isRangeInsideEditor(this.savedTextRange)) {
      selection.removeAllRanges();
      selection.addRange(this.savedTextRange);
      return;
    }

    const block = this.getCurrentEditableBlock();
    if (block) {
      this.focusBlockContents(block);
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.adjustTodoHeight();
      this.updateEditorFromForm();
      this.attachEditorSelectionListeners();
      this.updateToolbarState();
    }, 0);
  }

  ngOnDestroy(): void {
    this.selectionListenerCleanup.forEach((cleanup) => cleanup());
  }

  private updateEditorFromForm() {
    if (!this.notesEditor) return;
    const notesContent = this.getNotesContentForEditor();
    this.suppressEditorSync = true;
    this.notesEditor.nativeElement.innerHTML = notesContent;
    this.suppressEditorSync = false;
    this.updateToolbarState();
  }

  private getNotesContentForEditor() {
    const formValue = this.formGroup.get('notes')?.value;
    if (typeof formValue === 'string' && formValue.length > 0) {
      return formValue;
    }
    return this.initialNotesContent;
  }

  private isSelectionInsideEditor(selection: Selection): boolean {
    if (!selection.rangeCount) {
      return false;
    }

    return this.isRangeInsideEditor(selection.getRangeAt(0));
  }

  private isRangeInsideEditor(range: Range): boolean {
    const editor = this.notesEditor?.nativeElement;
    if (!editor) {
      return false;
    }

    return editor.contains(range.commonAncestorContainer);
  }

  private shouldPreserveEmptyMarkup(editor: HTMLDivElement): boolean {
    if (!editor.children.length) {
      return false;
    }

    return !!editor.querySelector('h4, blockquote, ul, li, b, strong, a');
  }

  generateColor(id: number) {
    return ` ${ColorUtils.COLORS[id]}`;
  }

  selectedColor() {
    return ` ${ColorUtils.COLORS[+this.scheduleData.colorCode]}`;
  }
}
