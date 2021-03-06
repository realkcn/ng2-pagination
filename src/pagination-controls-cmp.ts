import {Component, ViewChild, Input, Output, EventEmitter} from 'angular2/core'
import {Subscription} from 'rxjs';
import {PaginationService, IPaginationInstance} from "./pagination-service";
import {DEFAULT_TEMPLATE, DEFAULT_STYLES} from './template';

export interface IPage {
    label: string;
    value: any;
}

@Component({
    selector: 'pagination-controls',
    template: DEFAULT_TEMPLATE,
    styles: [DEFAULT_STYLES]
})
export class PaginationControlsCmp {

    @Input() id: string;
    @Input() maxSize: number = 7;
    @Input() directionLinks: boolean = true;
    @Input() autoHide: boolean = false;
    @Output() pageChange: EventEmitter<number> = new EventEmitter();
    @ViewChild('template') template;
    pages: IPage[] = [];
    private hasTemplate: boolean = false;
    private changeSub: Subscription;

    constructor(private service: PaginationService) {
        this.changeSub = this.service.change
            .subscribe(id => {
                if (this.id === id) {
                    this.updatePageLinks();
                }
            });
    }

    ngOnInit() {
        if (this.id === undefined) {
            this.id = this.service.defaultId;
        }
    }

    ngOnChanges() {
        this.updatePageLinks();
    }

    ngAfterViewInit() {
        if ((this.template) && 0 < this.template.nativeElement.children.length) {
            setTimeout(() => this.hasTemplate = true);
        }
    }

    ngOnDestroy() {
        this.changeSub.unsubscribe();
    }

    /**
     * Updates the page links and checks that the current page is valid. Should run whenever the
     * PaginationService.change stream emits a value matching the current ID, or when any of the
     * input values changes.
     */
    updatePageLinks() {
        let inst = this.service.getInstance(this.id);
        this.pages = this.createPageArray(inst.currentPage, inst.itemsPerPage, inst.totalItems, this.maxSize);

        const correctedCurrentPage = this.outOfBoundCorrection(inst);
        if (correctedCurrentPage !== inst.currentPage) {
            this.setCurrent(correctedCurrentPage);
        }
    }

    /**
     * Go to the previous page
     */
    previous() {
        this.setCurrent(this.getCurrent() - 1);
    }

    /**
     * Go to the next page
     */
    next() {
        this.setCurrent(this.getCurrent() + 1);
    }

    /**
     * Returns true if current page is first page
     */
    isFirstPage(): boolean {
        return this.getCurrent() === 1;
    }

    /**
     * Returns true if current page is last page
     */
    isLastPage(): boolean {
        return this.getLastPage() === this.getCurrent();
    }

    /**
     * Set the current page number.
     */
    setCurrent(page: number) {
        this.pageChange.emit(page);
    }

    /**
     * Get the current page number.
     */
    getCurrent(): number {
        return this.service.getCurrentPage(this.id);
    }

    /**
     * Returns the last page number
     */
    getLastPage(): number {
        let inst = this.service.getInstance(this.id);
        return Math.ceil(inst.totalItems / inst.itemsPerPage);
    }

    /**
     * Checks that the instance.currentPage property is within bounds for the current page range.
     * If not, return a correct value for currentPage, or the current value if OK.
     */
    private outOfBoundCorrection(instance: IPaginationInstance): number {
        const totalPages = Math.ceil(instance.totalItems / instance.itemsPerPage);
        if (totalPages < instance.currentPage && 0 < totalPages) {
            return totalPages;
        } else if (instance.currentPage < 1) {
            return 1;
        }

        return instance.currentPage;
    }

    /**
     * Returns an array of IPage objects to use in the pagination controls.
     */
    private createPageArray(currentPage: number, itemsPerPage: number, totalItems: number, paginationRange: number): IPage[] {
        // paginationRange could be a string if passed from attribute, so cast to number.
        paginationRange = +paginationRange;
        let pages = [];
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        const halfWay = Math.ceil(paginationRange / 2);

        const isStart = currentPage <= halfWay;
        const isEnd = totalPages - halfWay < currentPage;
        const isMiddle = !isStart && !isEnd;

        let ellipsesNeeded = paginationRange < totalPages;
        let i = 1;

        while (i <= totalPages && i <= paginationRange) {
            let label;
            let pageNumber = this.calculatePageNumber(i, currentPage, paginationRange, totalPages);
            let openingEllipsesNeeded = (i === 2 && (isMiddle || isEnd));
            let closingEllipsesNeeded = (i === paginationRange - 1 && (isMiddle || isStart));
            if (ellipsesNeeded && (openingEllipsesNeeded || closingEllipsesNeeded)) {
                label = '...';
            } else {
                label = pageNumber;
            }
            pages.push({
                label: label,
                value: pageNumber
            });
            i ++;
        }
        return pages;
    }

    /**
     * Given the position in the sequence of pagination links [i],
     * figure out what page number corresponds to that position.
     */
    private calculatePageNumber(i: number, currentPage: number, paginationRange: number, totalPages: number) {
        let halfWay = Math.ceil(paginationRange / 2);
        if (i === paginationRange) {
            return totalPages;
        } else if (i === 1) {
            return i;
        } else if (paginationRange < totalPages) {
            if (totalPages - halfWay < currentPage) {
                return totalPages - paginationRange + i;
            } else if (halfWay < currentPage) {
                return currentPage - halfWay + i;
            } else {
                return i;
            }
        } else {
            return i;
        }
    }
}
