import { parseAsStringLiteral, useQueryState } from 'nuqs';
import { NuqsAdapter } from 'nuqs/adapters/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Example_Array } from './examples/array';
import { Example_Async } from './examples/async';
import { Example_Basic } from './examples/basic';
import { Example_Issues } from './examples/issues';
import { Example_Effect } from './examples/effect';
import { Example_Transform } from './examples/transform';
import './styles.css';

const examples = {
  basic: {
    id: 'basic',
    label: 'Basic',
    description: 'Core field interactions: change, blur, focus, and validation state.',
    component: Example_Basic,
  },
  array: {
    id: 'array',
    label: 'Array',
    description: 'Dynamic list fields with append, remove, and per-item validation.',
    component: Example_Array,
  },
  async: {
    id: 'async',
    label: 'Async',
    description: 'Async validation and submission states with server-like checks.',
    component: Example_Async,
  },
  issues: {
    id: 'issues',
    label: 'Issues',
    description: 'Non-blocking warning levels and blocking issue levels alongside normal errors.',
    component: Example_Issues,
  },
  effect: {
    id: 'effect',
    label: 'Effect',
    description: 'Reactive form side effects driven by value and status updates.',
    component: Example_Effect,
  },
  transform: {
    id: 'transform',
    label: 'Transform',
    description: 'Subscribe to selectors that derive and format computed data.',
    component: Example_Transform,
  },
} as const;

const tabs = [
  { id: examples.basic.id, label: examples.basic.label },
  { id: examples.array.id, label: examples.array.label },
  { id: examples.async.id, label: examples.async.label },
  { id: examples.issues.id, label: examples.issues.label },
  { id: examples.effect.id, label: examples.effect.label },
  {
    id: examples.transform.id,
    label: examples.transform.label,
  },
] as const;

const Main = () => {
  const [example, setExample] = useQueryState(
    'example',
    parseAsStringLiteral([
      examples.basic.id,
      examples.array.id,
      examples.async.id,
      examples.issues.id,
      examples.effect.id,
      examples.transform.id,
    ]).withDefault(examples.basic.id),
  );

  const Example = examples[example].component;

  return (
    <div className='app'>
      <h1 className='app-title'>Oxform React</h1>
      {tabs.map(tab => (
        <button key={tab.id} className='tab-btn' data-active={example === tab.id} onClick={() => setExample(tab.id)}>
          {tab.label}
        </button>
      ))}
      <p className='example-description'>{examples[example].description}</p>
      <Example />
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NuqsAdapter>
      <Main />
    </NuqsAdapter>
  </StrictMode>,
);
