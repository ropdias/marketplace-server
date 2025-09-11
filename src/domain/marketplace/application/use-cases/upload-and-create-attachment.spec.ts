import { UploadAndCreateAttachmentsUseCase } from './upload-and-create-attachments'
import { InvalidAttachmentTypeError } from './errors/invalid-attachment-type-error'
import { UploadFailedError } from './errors/upload-failed-error'
import { InMemoryAttachmentsRepository } from 'test/repositories/in-memory-attachments-repository'
import { FakeUploader } from 'test/storage/fake-uploader'
import { AttachmentMapper } from '../mappers/attachment-mapper'

let inMemoryAttachmentsRepository: InMemoryAttachmentsRepository
let fakeUploader: FakeUploader
let sut: UploadAndCreateAttachmentsUseCase

describe('Upload and create attachments', () => {
  beforeEach(() => {
    inMemoryAttachmentsRepository = new InMemoryAttachmentsRepository()
    fakeUploader = new FakeUploader()

    sut = new UploadAndCreateAttachmentsUseCase(
      inMemoryAttachmentsRepository,
      fakeUploader,
    )
  })

  it('should be able to upload and create a single attachment', async () => {
    const result = await sut.execute({
      files: [
        {
          fileName: 'profile.png',
          fileType: 'image/png',
          body: Buffer.from(''),
        },
      ],
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(inMemoryAttachmentsRepository.items).toHaveLength(1)
      const createdAttachment = inMemoryAttachmentsRepository.items[0]
      const attachmentDTO = AttachmentMapper.toDTO(createdAttachment)

      expect(result.value.attachments[0]).toMatchObject(attachmentDTO)
      expect(fakeUploader.uploads).toHaveLength(1)
      expect(fakeUploader.uploads[0]).toMatchObject({
        fileName: 'profile.png',
      })
    }
  })

  it('should be able to upload and create multiple attachments', async () => {
    const result = await sut.execute({
      files: [
        {
          fileName: 'profile.png',
          fileType: 'image/png',
          body: Buffer.from(''),
        },
        {
          fileName: 'banner.jpeg',
          fileType: 'image/jpeg',
          body: Buffer.from(''),
        },
        {
          fileName: 'thumbnail.png',
          fileType: 'image/png',
          body: Buffer.from(''),
        },
      ],
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(inMemoryAttachmentsRepository.items).toHaveLength(3)

      const createdAttachment1 = inMemoryAttachmentsRepository.items[0]
      const attachmentDTO1 = AttachmentMapper.toDTO(createdAttachment1)
      expect(result.value.attachments[0]).toMatchObject(attachmentDTO1)

      const createdAttachment2 = inMemoryAttachmentsRepository.items[1]
      const attachmentDTO2 = AttachmentMapper.toDTO(createdAttachment2)
      expect(result.value.attachments[1]).toMatchObject(attachmentDTO2)

      const createdAttachment3 = inMemoryAttachmentsRepository.items[2]
      const attachmentDTO3 = AttachmentMapper.toDTO(createdAttachment3)
      expect(result.value.attachments[2]).toMatchObject(attachmentDTO3)

      expect(result.value.attachments).toHaveLength(3)
      expect(fakeUploader.uploads).toHaveLength(3)
      expect(fakeUploader.uploads[0]).toMatchObject({
        fileName: 'profile.png',
      })
      expect(fakeUploader.uploads[1]).toMatchObject({
        fileName: 'banner.jpeg',
      })
      expect(fakeUploader.uploads[2]).toMatchObject({
        fileName: 'thumbnail.png',
      })
    }
  })

  it('should not be able to upload an attachment with invalid file type', async () => {
    const result = await sut.execute({
      files: [
        {
          fileName: 'profile.mp3',
          fileType: 'audio/mpeg',
          body: Buffer.from(''),
        },
      ],
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidAttachmentTypeError)
    }
  })

  it('should not be able to upload attachments if one of them has invalid file type', async () => {
    const result = await sut.execute({
      files: [
        {
          fileName: 'profile.png',
          fileType: 'image/png',
          body: Buffer.from(''),
        },
        {
          fileName: 'audio.mp3',
          fileType: 'audio/mpeg',
          body: Buffer.from(''),
        },
      ],
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidAttachmentTypeError)
    }
    // No file should have been saved if one of the types is invalid
    expect(inMemoryAttachmentsRepository.items).toHaveLength(0)
    expect(fakeUploader.uploads).toHaveLength(0)
  })

  it('should return UploadFailedError when upload fails', async () => {
    // Configure the fake uploader to fail
    fakeUploader.shouldFail = true

    const result = await sut.execute({
      files: [
        {
          fileName: 'profile.png',
          fileType: 'image/png',
          body: Buffer.from(''),
        },
      ],
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(UploadFailedError)
    }
    // No file should have been saved if one of uploads fails
    expect(inMemoryAttachmentsRepository.items).toHaveLength(0)
    expect(fakeUploader.uploads).toHaveLength(0)
  })

  it('should rollback uploaded files when upload fails during multiple file upload', async () => {
    // Let's modify the fake uploader to fail after the first upload
    let uploadCount = 0
    const originalUpload = fakeUploader.upload.bind(fakeUploader)
    fakeUploader.upload = async (params) => {
      uploadCount++
      if (uploadCount > 1) {
        throw new Error('Simulated upload failure')
      }
      return originalUpload(params)
    }

    const result = await sut.execute({
      files: [
        {
          fileName: 'profile1.png',
          fileType: 'image/png',
          body: Buffer.from(''),
        },
        {
          fileName: 'profile2.png',
          fileType: 'image/png',
          body: Buffer.from(''),
        },
      ],
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(UploadFailedError)
    }
    // No attachment should have been saved in the repository
    expect(inMemoryAttachmentsRepository.items).toHaveLength(0)
    // The file that was successfully uploaded should have been removed during the rollback
    expect(fakeUploader.uploads).toHaveLength(0)
  })
})
