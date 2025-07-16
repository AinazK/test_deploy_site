import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, delay } from 'rxjs/operators';
import { API } from '../constants/api.constants';

export interface FilterParams {
  engineer_id: number | null;
  status_ids: number[] | null;
  start_date: string | null;
  end_date: string | null;
  page: number;
  per_page: number;
}

@Injectable({
  providedIn: 'root',
})
export class ManagerService {
  private requestsSubject = new BehaviorSubject<any[]>([]);
  public requests$ = this.requestsSubject.asObservable();

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  fetchRequests(filters: FilterParams): Observable<any> {
    return this.http
      .post(API.FILTER_REQUESTS, filters, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        catchError((error) => {
          console.error('Ошибка при загрузке заявок:', error);
          return of({ requests: [], total: 0 });
        })
      );
  }

  updateRequests(data: any[]) {
    this.requestsSubject.next(data);
  }

  getStoredRequests(): any[] {
    return this.requestsSubject.getValue();
  }

  getAllEngineers(): Observable<any[]> {
    const allEngineers: any[] = [];
    const perPage = 10;
    let page = 1;

    const loadPage = (): Observable<{ engineers: any[] }> => {
      return this.http
        .post<{ engineers: any[] }>(
          API.ENGINEERS_STATS,
          { page, per_page: perPage },
          { headers: this.getAuthHeaders() }
        )
        .pipe(catchError(() => of({ engineers: [] })));
    };

    return new Observable<any[]>((observer) => {
      const load = () => {
        loadPage().subscribe((response) => {
          if (!response || response.engineers.length === 0) {
            observer.next(allEngineers);
            observer.complete();
            return;
          }

          allEngineers.push(...response.engineers);
          page++;
          load();
        });
      };
      load();
    });
  }

  updateRequest(requestId: number, data: any): Observable<any> {
    return this.http
      .put(API.REQUEST_BY_ID(requestId), data, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        catchError((error) => {
          console.error('Ошибка при обновлении заявки:', error);
          return of(null);
        })
      );
  }

  assignEngineerToRequest(
    requestId: number,
    engineerId: number
  ): Observable<any> {
    return this.updateRequest(requestId, { engineer_id: engineerId });
  }

  getRequestHistory(requestId: number): Observable<any> {
    return this.http
      .get(API.REQUEST_HISTORY(requestId), {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        catchError((error) => {
          console.error('Ошибка при получении истории:', error);
          return of({ history: [], request_id: requestId });
        })
      );
  }

  public lastUsedFilters: FilterParams = {
    engineer_id: null,
    status_ids: null,
    start_date: null,
    end_date: null,
    page: 1,
    per_page: 5,
  };

  createRequest(data: any): Observable<any> {
    return new Observable((observer) => {
      this.http
        .post(API.REQUESTS + '/', data, {
          headers: this.getAuthHeaders(),
        })
        .pipe(
          catchError((error) => {
            console.error('Ошибка при создании заявки:', error);
            observer.next(null);
            observer.complete();
            return of(null);
          })
        )
        .subscribe((res: any) => {
          if (res && res.request_id) {
            // После успешного создания — обновляем заявки
            const currentFilters = {
              ...this.lastUsedFilters, // добавим это поле ниже
              page: 1,
            };

            this.fetchRequests(currentFilters).subscribe((response) => {
              this.updateRequests(response.requests || []);
            });
          }

          observer.next(res);
          observer.complete();
        });
    });
  }

  fetchEngineersPage(page: number, per_page: number): Observable<any> {
    const allFakeEngineers = [
      {
        user_id: 1,
        engineer_name: 'Иван Петров',
        active_requests: 5,
        completed_in_month: 23,
        balance: '15500',
      },
      {
        user_id: 2,
        engineer_name: 'Андрей Козлов',
        active_requests: 3,
        completed_in_month: 18,
        balance: '12300',
      },
      {
        user_id: 3,
        engineer_name: 'Максим Орлов',
        active_requests: 4,
        completed_in_month: 20,
        balance: '9800',
      },
      {
        user_id: 4,
        engineer_name: 'Сергей Смирнов',
        active_requests: 2,
        completed_in_month: 12,
        balance: '7500',
      },
      {
        user_id: 5,
        engineer_name: 'Алексей Иванов',
        active_requests: 6,
        completed_in_month: 28,
        balance: '19800',
      },
      {
        user_id: 6,
        engineer_name: 'Дмитрий Павлов',
        active_requests: 1,
        completed_in_month: 10,
        balance: '4500',
      },
      {
        user_id: 7,
        engineer_name: 'Илья Козин',
        active_requests: 3,
        completed_in_month: 19,
        balance: '8700',
      },
      {
        user_id: 8,
        engineer_name: 'Егор Максимов',
        active_requests: 7,
        completed_in_month: 30,
        balance: '22000',
      },
      {
        user_id: 9,
        engineer_name: 'Михаил Афанасьев',
        active_requests: 2,
        completed_in_month: 14,
        balance: '6600',
      },
      {
        user_id: 10,
        engineer_name: 'Кирилл Соколов',
        active_requests: 0,
        completed_in_month: 5,
        balance: '1200',
      },
      {
        user_id: 11,
        engineer_name: 'Никита Громов',
        active_requests: 4,
        completed_in_month: 16,
        balance: '8800',
      },
      {
        user_id: 12,
        engineer_name: 'Антон Белый',
        active_requests: 3,
        completed_in_month: 21,
        balance: '9900',
      },
    ];

    const start = (page - 1) * per_page;
    const end = start + per_page;
    const pageData = allFakeEngineers.slice(start, end);

    // ✳️ Возвращаем Observable, как будто это API
    return of({
      engineers: pageData,
      total: allFakeEngineers.length,
    });
    return this.http
      .post(
        API.ENGINEERS_STATS,
        { page, per_page },
        { headers: this.getAuthHeaders() }
      )
      .pipe(
        catchError((error) => {
          console.error('Ошибка при загрузке инженеров:', error);
          return of({ engineers: [], total: 0 });
        })
      );
  }

  useMock = true;

  updateEngineerBalance(
    engineerId: number,
    newBalance: number
  ): Observable<any> {
    if (this.useMock) {
      console.log(
        `[MOCK] Обновление баланса инженера ${engineerId} на ${newBalance}`
      );
      // Эмулируем успешный ответ с задержкой 500мс
      return of({
        message: 'Balance updated successfully',
        new_balance: newBalance,
        old_balance: '0.00',
      }).pipe(delay(500));
    } else {
      const body = { new_balance: newBalance };
      return this.http
        .put(API.BALANCE_UPDATE(engineerId), body, {
          headers: this.getAuthHeaders(),
        })
        .pipe(
          catchError((error) => {
            console.error('Ошибка при обновлении баланса:', error);
            return of(null);
          })
        );
    }
  }

  createUser(data: {
    role: string;
    name: string;
    login: string;
    password: string;
  }): Observable<any> {
    return this.http
      .post(API.USERS, data, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        catchError((error) => {
          console.error('Ошибка при создании пользователя:', error);
          return of(null);
        })
      );
  }
}
