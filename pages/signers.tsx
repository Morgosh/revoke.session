import K1SignersComponent from '@/components/manageK1Owners';
import R1SignersComponent from '@/components/manageR1Owners';

export default function SignersPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8 text-white">Wallet Signers</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <K1SignersComponent />
        </div>
        <div>
          <R1SignersComponent />
        </div>
      </div>
    </div>
  );
} 