import { Document } from 'langchain/document';
import { GetAllEventDetailForRAGResponseDto } from 'src/services/event-svc/modules/event/queries/getAllEventDetailForRAG/getAllEventDetailForRAG-response.dto';
import { CreateEventDto } from 'src/services/rag-svc/modules/descriptionGenerate/descriptionGenerate.dto';

export function transformEventsToDocuments(events: GetAllEventDetailForRAGResponseDto[]): Document[] {
  return events.map((event) => {
    const content = `
        Tên sự kiện: ${event.name}
        Mô tả chi tiết: ${event.description}

        Địa chỉ tổ chức: ${event.location}
        Tên địa điểm tổ chức: ${event.venue}
        Tổ chức bởi: ${event.organizer}
        Mô tả đơn vị tổ chức: ${event.organizerDescription}

        Hình thức: ${event.isOnlineEvent ? 'Trực tuyến' : 'Trực tiếp'}
        Sự kiện đặc biệt: ${event.isSpecialEvent ? 'Có' : 'Không'}
        Chỉ bán vé trên Evebox: ${event.isOnlyOnEvebox ? 'Có' : 'Không'}

        Tổng lượt xem: ${event.totalViews}
        Lượt xem/tuần, có thể dùng để đánh giá độ hot: ${event.viewsPerWeek}
        Giá vé: ${event.minPrice} ~ ${event.maxPrice} VNĐ
        Thể loại: ${event.categories.join(', ')}

        Các đêm diễn:
        ${event.showingTimes.map((show, i) => `
          - ${i + 1}. Từ ${show.start.toISOString()} đến ${show.end.toISOString()}
            Vé:
            ${show.ticketType.map(ticket => `
              • Tên vé: ${ticket.name}
                Mô tả quyền lợi: ${ticket.description}
                Giá: ${ticket.price} VNĐ
                Thời gian mở bán: ${ticket.startTime.toISOString()} - ${ticket.endTime.toISOString()}
            `).join('\n    ')}
        `).join('\n')}
      `.trim();

    return new Document({
      pageContent: content,
      metadata: { ...event },
    });
  });
}

export function transformEventsDescriptionToDocuments(events: GetAllEventDetailForRAGResponseDto[]): Document[] {
  return events.map((event) => {
    const content = `
        Tên sự kiện: ${event.name}
        Mô tả chi tiết: ${event.description}
      `.trim();

    return new Document({
      pageContent: content,
      metadata: { ...event },
    });
  });
}

export function transformEventsDtoToQuery(events: CreateEventDto): string {
  const categories = events.categoryIds.map((categoryId) => {
      switch (categoryId) {
        case 1:
          return 'music';
        case 2:
          return 'theaterstandard';
        case 3:
          return 'sport';
        case 4:
          return 'other';
        default:
          return 'other';
      }
    }
  );
  
  const content = `
        Tên sự kiện: ${events.name}
        Mô tả chi tiết: ${events.description}
        Hình thức: ${events.isOnlineEvent ? 'Trực tuyến' : 'Trực tiếp'}
        Địa chỉ tổ chức: ${events.location}
        Tên địa điểm tổ chức: ${events.venue}
        Tổ chức bởi: ${events.organizer}
        Mô tả đơn vị tổ chức: ${events.organizerDescription}
        Thể loại: ${categories.join(', ')}
      `.trim();

  return content;
}