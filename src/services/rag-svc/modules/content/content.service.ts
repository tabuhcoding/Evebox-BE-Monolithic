import { Inject, Injectable } from "@nestjs/common";
import { ContentDto } from "./content.dto";
import { ContentRepository } from "../../repository/content.repo";

@Injectable()
export class ContentService {
  constructor(
    @Inject('ContentRepository') private readonly contentRepository: ContentRepository,
  ) {}

  async createContent(dto: ContentDto) {
    try {
      const id = await this.contentRepository.insertOne({
        context: dto.context,
        message: dto.message,
        rootId: dto.rootId,
      });
      return { id };
    } catch (error) {
      return null;
    }
  }

  async getAllContent() {
    try {
      const tree = await this.buildContentTree(1);
      return tree;
    } catch (error) {
      return null;
    }
  }

  private async buildContentTree(id: number): Promise<any> {
    const content = await this.contentRepository.findOneWithChild(id);
    if (!content) return null;

    const updateContent = {
      ...content,
      isBot: true,
    };

    const childData = await Promise.all(
      updateContent.Child.map((child) => this.buildContentTree(child.id))
    );

    return {
      ...updateContent,
      Child: childData,
    };
  }
}
