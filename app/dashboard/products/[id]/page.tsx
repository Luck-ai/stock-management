import { ProductDetails } from "@/components/products/product-details"

interface ProductPageProps {
  params: {
    id: string
  }
}

export default function ProductPage({ params }: ProductPageProps) {
  return <ProductDetails productId={params.id} />
}
