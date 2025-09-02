import { ProductsListing } from "@/components/products/products-listing"

export default function ProductsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Products</h1>
        <p className="text-muted-foreground">Manage your product catalog and view detailed information</p>
      </div>
      <ProductsListing />
    </div>
  )
}
