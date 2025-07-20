import { Document } from 'langchain/document';
import { GetAllEventDetailForRAGResponseDto } from 'src/services/event-svc/modules/event/queries/getAllEventDetailForRAG/getAllEventDetailForRAG-response.dto';
import { EventDescriptionGenDto } from '../api/description-generate/description-generate.dto';

export class EventDocumentBuilder {
  /**
   * Build Document for full event info (LLM search use case)
   */
  static buildFullDocument(event: GetAllEventDetailForRAGResponseDto): Document {
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
      Lượt xem/tuần: ${event.viewsPerWeek}
      Giá vé đang còn bán: ${event.minAvailablePrice} ~ ${event.maxAvailablePrice} VNĐ
      Thể loại: ${event.categories.join(', ')}

      Trạng thái sự kiện: ${event.status}

      Các đêm diễn:
      ${event.showingTimes.map((show, i) => `
        - ${i + 1}. Từ ${show.start?.toISOString()} đến ${show.end?.toISOString()}
        Trạng thái: ${show.status}
          Vé:
          ${show.ticketType.map(ticket => `
            • Tên vé: ${ticket.name}
              Mô tả quyền lợi: ${ticket.description}
              Giá: ${ticket.price} VNĐ
              Thời gian mở bán: ${ticket.startSaleTime?.toISOString()} - ${ticket.endSaleTime?.toISOString()}
              Trạng thái: ${ticket.status}
          `).join('\n')}
      `).join('\n')}
    `.trim();

    return new Document({
      pageContent: content,
      metadata: {
        eventId: event.id,
        title: event.name.toLowerCase() + " " + event.organizer.toLowerCase(),
        type: event.categories.join(','),
        location: event.location.toLowerCase() + " " + event.venue.toLowerCase(),
        minPrice: event.minAvailablePrice,
        maxPrice: event.maxAvailablePrice,
        startDate: event.showingTimes[0]?.start.toISOString(),
        endDate: event.showingTimes.at(-1)?.end.toISOString(),
        isOnlineEvent: event.isOnlineEvent,
        isSpecialEvent: event.isSpecialEvent,
        isOnlyOnEvebox: event.isOnlyOnEvebox,
        viewsPerWeek: event.viewsPerWeek,
      },
    });
  }

  /**
   * Build Document for similarity embedding (description + context)
   */
  static buildSimilarityDocument(event: GetAllEventDetailForRAGResponseDto): Document {
    const content = `
      Tên sự kiện: ${event.name}
      Mô tả: ${event.description}
      Địa điểm: ${event.venue}, ${event.location}
      Hình thức: ${event.isOnlineEvent ? 'Trực tuyến' : 'Trực tiếp'}
      Đơn vị tổ chức: ${event.organizer}
      Thể loại: ${event.categories.join(', ')}
    `.trim();

    return new Document({
      pageContent: content,
      metadata: {
        eventId: event.id,
        title: event.name.toLowerCase() + " " + event.organizer.toLowerCase(),
        type: event.categories.join(','),
        location: event.location.toLowerCase() + " " + event.venue.toLowerCase(),
        minPrice: event.minAvailablePrice,
        maxPrice: event.maxAvailablePrice,
        startDate: event.showingTimes[0]?.start.toISOString(),
        endDate: event.showingTimes.at(-1)?.end.toISOString(),
        isOnlineEvent: event.isOnlineEvent,
        isSpecialEvent: event.isSpecialEvent,
        isOnlyOnEvebox: event.isOnlyOnEvebox,
        viewsPerWeek: event.viewsPerWeek,
      },
    });
  }

  /**
   * Event Builder to string
   */

  static eventToString(event: EventDescriptionGenDto, description: string): string {
    return `
      Tên sự kiện: ${event.name}
      Mô tả: ${description}
      Địa điểm: ${event.venue}, ${event.location}
      Hình thức: ${event.isOnlineEvent ? 'Trực tuyến' : 'Trực tiếp'}
      Đơn vị tổ chức: ${event.organizer}
      Thể loại: ${event.categories.join(', ')}
    `.trim();
  }

  static eventToStringWithDescription(event: GetAllEventDetailForRAGResponseDto): string {
    return `
      Tên sự kiện: ${event.name}
      Mô tả: ${event.description}
      Địa điểm: ${event.venue}, ${event.location}
      Hình thức: ${event.isOnlineEvent ? 'Trực tuyến' : 'Trực tiếp'}
      Đơn vị tổ chức: ${event.organizer}
      Thể loại: ${event.categories.join(', ')}
    `.trim();
  }
}
