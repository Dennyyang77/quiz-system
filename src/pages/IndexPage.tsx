import { AccessibleMath } from '../components/math/AccessibleMath';

export function IndexPage() {
  return (
    <div className="space-y-8">
      <section aria-labelledby="welcome-heading">
        <h2 id="welcome-heading" className="text-2xl font-bold">
          歡迎使用無障礙數學測驗系統
        </h2>
        <p className="mt-2 text-gray-600">
          本系統專為視障學生設計，搭配 NVDA 螢幕閱讀器使用，
          讓您能以語音朗讀方式理解數學題目並作答。
        </p>
      </section>

      <section aria-labelledby="demo-heading" className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 id="demo-heading" className="text-lg font-semibold">
          數學符號朗讀範例
        </h3>
        <p className="mt-4 text-gray-700">
          分數：
          <AccessibleMath latex="\frac{1}{2}" spoken="二分之一" />
        </p>
        <p className="mt-2 text-gray-700">
          方程式：
          <AccessibleMath latex="x^2 + 2x + 1 = 0" spoken="x 平方加 2x 加 1 等於 0" />
        </p>
        <p className="mt-2 text-gray-700">
          展示模式：
          <AccessibleMath
            latex="\int_{0}^{1} x^2 \, dx = \frac{1}{3}"
            spoken="從 0 到 1 對 x 平方積分等於三分之一"
            display
          />
        </p>
      </section>
    </div>
  );
}
