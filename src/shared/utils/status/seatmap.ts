import { Seatmap } from "src/services/event-svc/repository/seatmap/seatmap.repo"

export enum SeatmapType {
 NOT_A_SEATMAP = 'NOT_A_SEATMAP',
 SELECT_SECTION = 'SELECT_SECTION',
 SELECT_SEAT = 'SELECT_SEAT',
}

export function getSeatmapType(seatmap: Seatmap): SeatmapType {
  if (!seatmap || seatmap.id === 0) {
    return SeatmapType.NOT_A_SEATMAP
  }

  if (!seatmap.Section) {
    return SeatmapType.NOT_A_SEATMAP
  }

  if (seatmap.Section.some(section => section.Row && section.Row.length > 0)) {
    return SeatmapType.SELECT_SEAT
  }

  return SeatmapType.SELECT_SECTION
}