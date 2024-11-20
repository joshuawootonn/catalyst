'use server';

import { ClientBcImage } from './client';
import { ComponentPropsWithRef } from 'react';
import Image from 'next/image';
type NextImageProps = Omit<ComponentPropsWithRef<typeof Image>, 'quality'>;

interface BcImageOptions {
  lossy?: boolean;
}

type Props = NextImageProps & BcImageOptions;

const cdnHostname = process.env.BIGCOMMERCE_CDN_HOSTNAME ?? 'cdn11.bigcommerce.com';

async function blobToBase64(blob: Blob) {
  const arrayBuffer = await blob.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  let binaryString = '';
  for (let i = 0; i < uint8Array.byteLength; i++) {
    binaryString += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binaryString);
}

const lqipData = async (urlTemplate: string) => {
  const url = urlTemplate.replace('{:size}', '10x10'); // get a tiny image
  const response = await fetch(url, { cache: 'force-cache' }); // cache forever
  const blob = await response.blob();
  const base64 = await blobToBase64(blob);
  return `data:${blob.type};base64,${base64}`;
};

export const BcImage = async ({ ...props }: Props) => {
  if (props.src.startsWith(`https://${cdnHostname}`) && props.src.includes('{:size}')) {
    if (props.priority) {
      // priority implies no LQIP for things like logo
      return <ClientBcImage {...props} />
    }
    // generate LQIP
    const lqip = await lqipData(props.src);
    return <ClientBcImage {...props} blurDataURL={lqip} placeholder="blur" />;
  }
  return <Image {...props} />;
};
