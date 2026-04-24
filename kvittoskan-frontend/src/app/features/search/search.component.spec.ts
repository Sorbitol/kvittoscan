
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SearchComponent } from './search.component';

describe('SearchComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SearchComponent],
      providers: [provideRouter([])],
    });
  });

  function create() {
    const fixture = TestBed.createComponent(SearchComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('should render without error', () => {
    const f = create();
    expect(f.nativeElement).toBeTruthy();
  });

  it('should render search input', () => {
    const f = create();
    const input = (f.nativeElement as HTMLElement).querySelector('.search-input') as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.placeholder).toMatch(/Sök|Search/);
  });

  it('should show popular suggestions when query is empty', () => {
    const f = create();
    const text = (f.nativeElement as HTMLElement).textContent;
    expect(text).toMatch(/Populära sökningar|Popular searches/);
  });

  it('should show results list', () => {
    const f = create();
    const list = (f.nativeElement as HTMLElement).querySelector('.results-list');
    expect(list).toBeTruthy();
  });

  it('should hide clear button when query is empty', () => {
    const f = create();
    const clearBtn = (f.nativeElement as HTMLElement).querySelector('.search-clear');
    expect(clearBtn).toBeNull();
  });

  it('should show clear button when query is non-empty', () => {
    const f = create();
    const component = f.componentInstance;
    component.query.set('Kaffe');
    f.detectChanges();
    const clearBtn = (f.nativeElement as HTMLElement).querySelector('.search-clear');
    expect(clearBtn).toBeTruthy();
  });

  it('should filter results when query is set', () => {
    const f = create();
    const component = f.componentInstance;
    component.query.set('Kaffe');
    f.detectChanges();
    // Popular suggestions should be hidden when searching
    const suggestions = (f.nativeElement as HTMLElement).querySelector('.suggestions');
    expect(suggestions).toBeNull();
  });

  it('should show filter panel when showFilters is true', () => {
    const f = create();
    const component = f.componentInstance;
    component.showFilters.set(true);
    f.detectChanges();
    const panel = (f.nativeElement as HTMLElement).querySelector('.filter-panel');
    expect(panel).toBeTruthy();
  });

  it('should have a list of items from seed data', () => {
    const f = create();
    const rows = (f.nativeElement as HTMLElement).querySelectorAll('.result-row');
    expect(rows.length).toBeGreaterThan(0);
  });
});
