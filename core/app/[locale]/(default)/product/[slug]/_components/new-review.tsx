'use client';

import React, { useState, ChangeEvent } from 'react';
import { useFormStatus } from 'react-dom';

import { Button } from '~/components/ui/button';
import { AtSign, CircleUser, MessageCircleMore } from 'lucide-react';
import {
  Form,
  FormSubmit,
  Field,
  FieldLabel,
  FieldControl,
  FieldMessage,
  Input,
  TextArea,
} from '~/components/ui/form';
import { Rating } from '~/components/ui/rating';

import { submitNewReview } from './submit-new-review';

interface Props {
  productEntityId: number;
}

const Submit = () => {
  const { pending } = useFormStatus();

  return (
    <FormSubmit asChild>
      <Button
        className="relative mt-8 w-fit items-center px-8 py-2"
        loading={pending}
        loadingText="Submitting"
        variant="primary"
      >
        Submit Review
      </Button>
    </FormSubmit>
  );
};

export const NewReview = ({ productEntityId }: Props) => {
  const [formData, setFormData] = useState({
    author: '',
    email: '',
    title: '',
    text: '',
    rating: 0,
    productEntityId: productEntityId,
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRatingChange = (newRating: number) => {
    setFormData({
      ...formData,
      rating: newRating,
    });
  };

const onSubmit = async () => {
  const formDataToSend = new FormData();
  formDataToSend.append('author', formData.author);
  formDataToSend.append('email', formData.email);
  formDataToSend.append('title', formData.title);
  formDataToSend.append('text', formData.text);
  formDataToSend.append('rating', formData.rating.toString());
  formDataToSend.append('productEntityId', formData.productEntityId.toString());

  // Convert FormData to a plain object and ensure number types
  const data: { [key: string]: any } = {};
  formDataToSend.forEach((value, key) => {
    data[key] = key === 'rating' || key === 'productEntityId' ? Number(value) : value;
  });

  // Now `data` has `rating` and `productEntityId` as numbers
  const submit = await submitNewReview(formDataToSend);
  console.log(submit);
};

  return (
    <Form
      className="x-auto mb-10 mt-8 grid grid-cols-1 gap-y-6 lg:w-2/3 lg:grid-cols-2 lg:gap-x-6 lg:gap-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <Field className="relative space-y-2 pb-7" name="author">
        <FieldLabel htmlFor="author" isRequired={true}>
          Author
        </FieldLabel>
        <FieldControl asChild>
          <Input
            id="author"
            name="author"
            type="text"
            value={formData.author}
            onChange={handleChange}
            placeholder="Enter your name"
            error={formData.author === ''}
            required={true}
            icon={<CircleUser />}
          />
        </FieldControl>
        <div className="relative h-7">
          <FieldMessage
            className="absolute inset-x-0 bottom-0 inline-flex w-full text-xs font-normal text-error"
            match="valueMissing"
          >
            Name is required
          </FieldMessage>
        </div>
      </Field>

      <Field className="relative space-y-2 pb-7" name="email">
        <FieldLabel className="font-semibold" htmlFor="email" isRequired={true}>
          Email
        </FieldLabel>
        <FieldControl asChild>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter an email"
            error={formData.email === ''}
            required={true}
            icon={<AtSign />}
          />
        </FieldControl>
        <div className="relative space-y-2 pb-7">
          <FieldMessage
            className="absolute inset-x-0 bottom-0 inline-flex w-full text-xs font-normal text-error"
            match="valueMissing"
          >
            Please enter a email
          </FieldMessage>
        </div>
      </Field>

      <Field className="relative space-y-2 pb-7" name="title">
        <FieldLabel className="font-semibold" htmlFor="title" isRequired={true}>
          Title
        </FieldLabel>
        <FieldControl asChild>
          <Input
            id="title"
            name="title"
            type="text"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter a title"
            error={formData.title === ''}
            required={true}
            icon={<MessageCircleMore />}
          />
        </FieldControl>
        <div className="relative space-y-2 pb-7">
          <FieldMessage
            className="absolute inset-x-0 bottom-0 inline-flex w-full text-xs font-normal text-error"
            match="valueMissing"
          >
            Please enter a title
          </FieldMessage>
        </div>
      </Field>

      <Field className="relative space-y-2 pb-7" name="rating">
        <FieldLabel className="font-semibold" htmlFor="rating" isRequired={true}>
          Rating
        </FieldLabel>
        <FieldControl asChild>
          <Rating rating={formData.rating} onChange={handleRatingChange} />
        </FieldControl>
        <div className="relative h-7">
          <FieldMessage
            className="absolute inset-x-0 bottom-0 inline-flex w-full text-xs font-normal text-error"
            match="valueMissing"
          >
            Please provide a rating
          </FieldMessage>
        </div>
      </Field>

      <Field className="relative col-span-full max-w-full space-y-2 pb-5" name="text">
        <FieldLabel htmlFor="text" isRequired>
          Review
        </FieldLabel>
        <FieldControl asChild>
          <TextArea
            id="text"
            name="text"
            value={formData.text}
            onChange={handleChange}
            placeholder="Write your review"
            error={formData.text === ''}
            required={true}
          />
        </FieldControl>
        <div className="relative h-7">
          <FieldMessage
            className="absolute inset-x-0 bottom-0 inline-flex w-full text-xs font-normal text-error"
            match="valueMissing"
          >
            Review is required
          </FieldMessage>
        </div>
      </Field>

      <Submit />
    </Form>
  );
};
