import { UploadAndCreateAttachmentUseCase } from './upload-and-create-attachment'
import { InvalidAttachmentTypeError } from './errors/invalid-attachment-type-error'
import { InMemoryAttachmentsRepository } from 'test/repositories/in-memory-attachments-repository'
import { FakeUploader } from 'test/storage/fake-uploader'
import { AttachmentMapper } from '../mappers/attachment-mapper'

let inMemoryAttachmentsRepository: InMemoryAttachmentsRepository
let fakeUploader: FakeUploader
let attachmentMapper: AttachmentMapper
let sut: UploadAndCreateAttachmentUseCase

describe('Upload and create attachment', () => {
  beforeEach(() => {
    inMemoryAttachmentsRepository = new InMemoryAttachmentsRepository()
    fakeUploader = new FakeUploader()
    attachmentMapper = new AttachmentMapper()

    sut = new UploadAndCreateAttachmentUseCase(
      inMemoryAttachmentsRepository,
      fakeUploader,
      attachmentMapper,
    )
  })

  it('should be able to upload and create an attachment', async () => {
    const result = await sut.execute({
      fileName: 'profile.png',
      fileType: 'image/png',
      body: Buffer.from(''),
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(inMemoryAttachmentsRepository.items).toHaveLength(1)
      const createdAttachment = inMemoryAttachmentsRepository.items[0]
      const attachmentDTO = attachmentMapper.toDTO(createdAttachment)

      expect(result.value.attachment).toMatchObject(attachmentDTO)
      expect(fakeUploader.uploads).toHaveLength(1)
      expect(fakeUploader.uploads[0]).toMatchObject({
        fileName: 'profile.png',
      })
    }
  })

  it('should not be able to upload an attachment with invalid file type', async () => {
    const result = await sut.execute({
      fileName: 'profile.mp3',
      fileType: 'audio/mpeg',
      body: Buffer.from(''),
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidAttachmentTypeError)
    }
  })
})
