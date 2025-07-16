import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Navigation } from '../../components/navigation/navigation';
import { EngineerService } from '../../services/engineer.service';
import { CommonModule } from '@angular/common';

interface EngineerRequest {
  address: string;
  assigned_time: string;
  creation_date: string;
  customer_name: string;
  description: string;
  done_time: string | null;
  engineer_id: number;
  equipment: string;
  in_works_time: string | null;
  operator_id: number;
  phone: string;
  request_id: number;
  status_id: number;
}

@Component({
  selector: 'app-engineer-page',
  imports: [Navigation, CommonModule],
  templateUrl: './engineer-page.html',
  styleUrl: './engineer-page.scss',
})
export class EngineerPage implements OnInit {
  @ViewChild('calendarScroll') calendarScrollRef!: ElementRef;

  requests: EngineerRequest[] = [];
  expandedRequestId: number | null = null;
  days: { date: Date; weekDay: string }[] = [];
  selectedDate: Date = new Date();
  expandedEventId: number | null = null;

  expandedCompletedRequestId: number | null = null;
  completedRequests: EngineerRequest[] = [];
  completedPage = 1;
  completedTotal = 0;
  isLoadingCompleted = false;

  events: EngineerRequest[] = [];

  activeRequests: number = 0;
  completedThisMonth: number = 0;
  balance: string = '0';

  constructor(private engineerService: EngineerService) {}

  ngOnInit(): void {
    this.requests = [
      // {
      //   address: 'ул. Пушкина, д. 10 п.3 этаж 2 квартира 5',
      //   assigned_time: 'Thu, 06 Jul 2025 08:29:32 GMT',
      //   creation_date: 'Thu, 03 Jul 2025 08:29:32 GMT',
      //   customer_name: 'Андрей Иванов',
      //   description: 'Не включается',
      //   done_time: null,
      //   engineer_id: 28,
      //   equipment: 'Холодильник',
      //   in_works_time: null,
      //   operator_id: 30,
      //   phone: '+79876543210',
      //   request_id: 8,
      //   status_id: 2,
      // },
      // {
      //   address: 'ул. Пушкина, д. 10',
      //   assigned_time: 'Thu, 03 Jul 2025 08:29:30 GMT',
      //   creation_date: 'Thu, 03 Jul 2025 08:29:30 GMT',
      //   customer_name: 'Андрей Иванов',
      //   description: 'Не включается',
      //   done_time: null,
      //   engineer_id: 28,
      //   equipment: 'Холодильник',
      //   in_works_time: null,
      //   operator_id: 30,
      //   phone: '+79876543210',
      //   request_id: 7,
      //   status_id: 2,
      // },
      // {
      //   address: 'ул. Пушкина, д. 10',
      //   assigned_time: 'Thu, 03 Jul 2025 08:29:28 GMT',
      //   creation_date: 'Thu, 03 Jul 2025 08:29:28 GMT',
      //   customer_name: 'Андрей Иванов',
      //   description: 'Не включается',
      //   done_time: null,
      //   engineer_id: 28,
      //   equipment: 'Холодильник',
      //   in_works_time: null,
      //   operator_id: 30,
      //   phone: '+79876543210',
      //   request_id: 6,
      //   status_id: 2,
      // },
    ];

    this.events = [...this.requests];

    this.engineerService.getEngineerActive().subscribe({
      next: (response) => {
        this.requests = response.requests;
        this.events = [...response.requests];
        console.log('Заявки инженера:', response);
      },
      error: (error) => {
        console.error('Ошибка при загрузке заявок:', error);
      },
    });

    this.days = this.generateDaysWithPast(7, 14);
    this.loadCompletedRequests();

    const myEngineerId = Number(localStorage.getItem('user_id'));

    this.engineerService.getEngineerStats(1, 20).subscribe({
      next: (response) => {
        const currentEngineer = response.engineers.find(
          (eng: any) => eng.user_id === myEngineerId
        );

        if (currentEngineer) {
          this.activeRequests = currentEngineer.active_requests;
          this.completedThisMonth = currentEngineer.completed_in_month;
          this.balance = currentEngineer.balance;
        }
      },
      error: (error) => {
        console.error('Ошибка при получении статистики инженера:', error);
      },
    });
  }

  toggleDetails(id: number): void {
    this.expandedRequestId = this.expandedRequestId === id ? null : id;
  }

  markInProgress(request: EngineerRequest): void {
    const now = new Date().toUTCString();
    request.status_id = 3;
    request.in_works_time = now;

    this.engineerService
      .updateRequestTimes(request.request_id, {
        in_works_time: now,
        status_id: 3,
      })
      .subscribe({
        next: () => console.log('Отправлено: начало работ'),
        error: (error) => console.error('Ошибка при обновлении:', error),
      });
  }

  markDone(request: EngineerRequest): void {
    const now = new Date().toUTCString();
    request.status_id = 4;
    request.done_time = now;

    this.engineerService
      .updateRequestTimes(request.request_id, {
        done_time: now,
        status_id: 4,
      })
      .subscribe({
        next: () => console.log('Отправлено: завершение работ'),
        error: (error) => console.error('Ошибка при обновлении:', error),
      });
  }

  ngAfterViewInit() {
    setTimeout(() => {
      const scrollContainer = this.calendarScrollRef
        .nativeElement as HTMLElement;
      const todayEl = document.getElementById('today');

      if (todayEl && scrollContainer) {
        const gap = 12; // отступ между днями в px, подстрой под свой CSS
        const scrollLeft =
          todayEl.offsetLeft -
          scrollContainer.offsetLeft -
          (todayEl.offsetWidth + gap);

        // Чтобы не получить отрицательное значение
        const finalScrollLeft = scrollLeft > 0 ? scrollLeft : 0;

        scrollContainer.scrollTo({
          left: finalScrollLeft,
          behavior: 'smooth',
        });
      }
    }, 0);
  }

  generateDaysWithPast(past: number, future: number) {
    const result = [];
    const today = new Date();

    for (let i = -past; i <= future; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      result.push({
        date,
        weekDay: this.getWeekDayName(date.getDay()),
      });
    }

    return result;
  }

  getWeekDayName(dayIndex: number): string {
    const names = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    return names[(dayIndex + 6) % 7];
  }

  isToday(date: Date): boolean {
    const now = new Date();
    return (
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  }

  isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  get eventsForSelectedDay() {
    return this.events.filter((event) =>
      this.isSameDay(new Date(event.assigned_time), this.selectedDate)
    );
  }

  onSelectDay(dayDate: Date) {
    this.selectedDate = dayDate;

    const formattedDate = dayDate.toISOString().split('T')[0]; // YYYY-MM-DD
    console.log('отправляю данные', formattedDate);

    this.engineerService.getEngineerRequests(formattedDate).subscribe({
      next: (response) => {
        this.events = [...response.requests];
        console.log('Заявки на выбранный день:', this.events);
      },
      error: (error) => {
        console.error('Ошибка при загрузке заявок на дату:', error);
      },
    });
  }

  toggleEventDetails(id: number): void {
    this.expandedEventId = this.expandedEventId === id ? null : id;
  }

  loadCompletedRequests(): void {
    if (this.isLoadingCompleted) return;

    this.isLoadingCompleted = true;

    this.engineerService.getCompletedRequests(this.completedPage).subscribe({
      next: (response) => {
        this.completedRequests.push(...response.requests);
        this.completedPage++;
        this.completedTotal = response.total;

        this.isLoadingCompleted = false;
      },
      error: (error) => {
        console.error('Ошибка при загрузке выполненных заявок:', error);
        this.isLoadingCompleted = false;
      },
    });
  }

  toggleCompletedDetails(id: number): void {
    this.expandedCompletedRequestId =
      this.expandedCompletedRequestId === id ? null : id;
  }
}
